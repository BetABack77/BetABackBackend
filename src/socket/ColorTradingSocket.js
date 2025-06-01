// game.controller.js
import { User } from "../model/User.model.js";
import mongoose from "mongoose";
import { UserBetHistory } from "../model/UserBetHistory.model.js";

const ROUND_DURATION = 30000; // 30 seconds
const MAX_HISTORY = 10;
const PAYOUTS = {
  red: 1.95,
  green: 1.95,
  blue: 5.0,
};

class GameRound {
  constructor() {
    this.roundId = Date.now().toString();
    this.players = [];
    this.createdAt = new Date();
    this.totals = { red: 0, green: 0, blue: 0 };
    this.result = null;
    this.endedAt = null;
  }
}

const getTimeRemaining = (round) => {
  const now = new Date();
  const elapsed = now - round.createdAt;
  return Math.max(0, ROUND_DURATION - elapsed);
};

export default function setupColorGameWebSocket(io) {
  let currentRound = new GameRound();
  const roundHistory = [];
  let timerInterval = null;

  const startNewRound = () => {
    // Save to history if there were players
    if (currentRound.players.length > 0) {
      roundHistory.push({
        roundId: currentRound.roundId,
        result: currentRound.result,
        totals: { ...currentRound.totals },
        endedAt: currentRound.endedAt,
      });

      // Keep only last 10 rounds
      if (roundHistory.length > MAX_HISTORY) {
        roundHistory.shift();
      }
    }

    // Start new round
    currentRound = new GameRound();
    io.emit("color_newRound", {
      roundId: currentRound.roundId,
      startedAt: currentRound.createdAt,
      serverTime: Date.now(),
      history: roundHistory.slice(-10),
    });

    // Schedule next round end
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setTimeout(endCurrentRound, ROUND_DURATION);
  };

  const endCurrentRound = async () => {
    currentRound.endedAt = new Date();

    // // Determine result (30% blue, 35% red, 35% green)
    // const random = Math.random();
    // if (random < 0.3) {
    //   currentRound.result = "blue";
    // } else if (random < 0.65) {
    //   currentRound.result = "red";
    // } else {
    //   currentRound.result = "green";
    // }

    // const random = Math.random();

    // if (random < 0.1) {
    //   currentRound.result = "blue"; // 10%
    // } else if (random < 0.45) {
    //   currentRound.result = "green"; // 35% (10% to 45%)
    // } else {
    //   currentRound.result = "red"; // 55% (rest)
    // }

    const random = Math.random();

    if (random < 0.1) {
      currentRound.result = "blue"; // 10%
    } else {
      // From 10% to 100% → randomly choose green or red
      currentRound.result = Math.random() < 0.5 ? "green" : "red"; // 45% each
    }

    // Process all pending bets
    const pendingBets = await UserBetHistory.find({
      roundId: currentRound.roundId,
      result: "pending",
    });

    const bulkUpdates = [];
    for (const bet of pendingBets) {
      const isWinner = bet.choice === currentRound.result;
      const payout = isWinner ? bet.amount * PAYOUTS[bet.choice] : 0;

      bulkUpdates.push({
        updateOne: {
          filter: { _id: bet._id },
          update: {
            $set: {
              result: isWinner ? "win" : "lose",
              payout,
              updatedAt: new Date(),
            },
          },
        },
      });
    }

    if (bulkUpdates.length > 0) {
      await UserBetHistory.bulkWrite(bulkUpdates);
    }

    // Process winners
    const winners = currentRound.players.filter(
      (p) => p.choice === currentRound.result
    );
    const updatePromises = winners.map(async (player) => {
      try {
        const payout = player.amount * PAYOUTS[player.choice];
        await User.findByIdAndUpdate(player.userId, {
          $inc: { balance: payout },
        });
        player.payout = payout;
      } catch (error) {
        console.error(
          `Error processing payout for user ${player.userId}:`,
          error
        );
      }
    });

    await Promise.all(updatePromises);

    // Emit results
    io.emit("color_roundResult", {
      roundId: currentRound.roundId,
      result: currentRound.result,
      totals: currentRound.totals,
      history: roundHistory.slice(-10),
    });

    // Notify individual players
    currentRound.players.forEach((player) => {
      const isWinner = player.choice === currentRound.result;
      const winAmount = isWinner ? player.amount * PAYOUTS[player.choice] : 0;

      io.to(player.userId.toString()).emit("color_roundOutcome", {
        result: isWinner ? "win" : "lose",
        choice: player.choice,
        winningColor: currentRound.result,
        amount: winAmount,
        message: isWinner
          ? `🎉 You won ₹${winAmount.toFixed(2)}!`
          : `😢 You lost this round!`,
      });
    });

    // Start next round
    startNewRound();
  };

  io.on("connection", (socket) => {
    // Register user
    socket.on("color_registerUser", (roomName) => {
      socket.join(roomName);

      socket.emit("color_gameState", {
        currentRound: {
          roundId: currentRound.roundId,
          startedAt: currentRound.createdAt,
          timeLeft: getTimeRemaining(currentRound),
          serverTime: Date.now(),
        },
        history: roundHistory.slice(-10),
      });
    });

    // Handle bet placement
    socket.on("placeColorBet", async ({ userId, choice, amount }) => {
      try {
        if (currentRound.endedAt) {
          return socket.emit("color_error", "Round has ended");
        }
        if (!["red", "green", "blue"].includes(choice)) {
          return socket.emit("color_error", "Invalid choice");
        }
        if (isNaN(amount) || amount < 1) {
          return socket.emit("color_error", "Invalid amount");
        }

        socket.join(userId.toString());

        // Check balance
        const user = await User.findById(userId);
        if (!user) return socket.emit("color_error", "User not found");
        if (user.balance < amount) {
          return socket.emit("color_error", "Insufficient balance");
        }

        // Record bet
        const betRecord = new UserBetHistory({
          gameType: "ColorPrediction",
          userId,
          roundId: currentRound.roundId,
          choice,
          amount,
          result: "pending",
        });
        await betRecord.save();

        // Deduct balance
        await User.findByIdAndUpdate(userId, {
          $inc: { balance: -amount },
        });

        // Update round data
        currentRound.players.push({ userId, choice, amount });
        currentRound.totals[choice] += amount;

        // Notify user
        socket.emit("color_betPlaced", { amount, choice });
        socket.emit("color_balanceUpdate", {
          balance: user.balance - amount,
        });
      } catch (error) {
        console.error("Error placing bet:", error);
        socket.emit("color_error", "Failed to place bet");
      }
    });

    socket.on("disconnect", () => {
      // Handle disconnect
    });
  });

  // Start first round
  startNewRound();
}
