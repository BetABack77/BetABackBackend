

import { User } from "../model/User.model.js";
import mongoose from "mongoose";
import { UserBetHistory } from "../model/UserBetHistory.model.js";

const ROUND_DURATION = 30000; // 30 seconds
const MAX_HISTORY = 10;

class GameRound {
  constructor() {
    this.roundId = Date.now().toString();
    this.players = [];
    this.createdAt = new Date();
    this.totals = { up: 0, down: 0 };
    this.result = null;
    this.endedAt = null;
  }
}

const getTimeRemaining = (round) => {
  const now = new Date();
  const elapsed = now - round.createdAt;
  return Math.max(0, ROUND_DURATION - elapsed);
};

export default function setupTradingWebSocket(io) {
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
    // io.emit("newRound", {
    //   roundId: currentRound.roundId,
    //   startedAt: currentRound.createdAt,
    //   history: roundHistory.slice(-5), // Send last 5 rounds for display
    // });

    io.emit("risefall_newRound", {
      roundId: currentRound.roundId,
      startedAt: currentRound.createdAt,
      serverTime: Date.now(), // Add this
      history: roundHistory.slice(-5),
    });

    // Schedule next round end
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setTimeout(endCurrentRound, ROUND_DURATION);
  };

  const endCurrentRound = async () => {
    currentRound.endedAt = new Date();

    // Determine result (50/50 chance)
    currentRound.result = Math.random() < 0.5 ? "up" : "down";
    // currentRound.result = "up";

    // 2. Get all pending bets for this round
    const pendingBets = await UserBetHistory.find({
      roundId: currentRound.roundId,
      result: "pending",
    });

    // 3. Process each bet
    const bulkUpdates = [];
    // const winners = [];

    for (const bet of pendingBets) {
      const isWinner = bet.choice === currentRound.result;
      const payout = isWinner ? bet.amount * 1.95 : 0;

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

      // if (isWinner) winners.push({ userId: bet.userId, payout });
    }

    // 4. Execute all updates in bulk
    if (bulkUpdates.length > 0) {
      await UserBetHistory.bulkWrite(bulkUpdates);
    }

    // Process winners
    const winners = currentRound.players.filter(
      (p) => p.choice === currentRound.result
    );
    const updatePromises = winners.map(async (player) => {
      try {
        const payout = player.amount * 1.95;
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
    io.emit("risefall_roundResult", {
      roundId: currentRound.roundId,
      result: currentRound.result,
      totals: currentRound.totals,
      history: roundHistory.slice(-5),
    });

    // Notify individual players
    currentRound.players.forEach((player) => {
      const isWinner = player.choice === currentRound.result;
      const winAmount = isWinner ? player.amount * 1.95 : 0;

      io.to(player.userId.toString()).emit("risefall_roundOutcome", {
        result: isWinner ? "win" : "lose",
        choice: player.choice,
        winningSide: currentRound.result,
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
    // console.log("New client connected:", socket.id);

    // Register user and join room
    socket.on("risefall_registerUser", (roomName) => {
      // if (!userId) return;
      // console.log("User registered:", roomName);

      socket.join(roomName);

      // Modify the gameState emission to include precise timing
      socket.emit("risefall_gameState", {
        currentRound: {
          roundId: currentRound.roundId,
          startedAt: currentRound.createdAt,
          timeLeft: getTimeRemaining(currentRound), // Add this
          serverTime: Date.now(), // Add server timestamp
        },
        history: roundHistory.slice(-5),
      });
    });

    // Handle bet placement
    socket.on("placeBetForex", async ({ userId, choice, amount }) => {
      // console.log("hello we are in forex tree place bet");
      try {
        // Validate
        if (currentRound.endedAt) {
          return socket.emit("risefall_error", "Round has ended");
        }
        if (!["up", "down"].includes(choice)) {
          return socket.emit("risefall_error", "Invalid choice");
        }
        if (isNaN(amount) || amount < 1) {
          return socket.emit("risefall_error", "Invalid amount");
        }

        socket.join(userId.toString());

        // Check balance
        const user = await User.findById(userId);
        if (!user) return socket.emit("risefall_error", "User not found");

        const betRecord = new UserBetHistory({
          gameType: "ForexTree",
          userId,
          roundId: currentRound.roundId,
          choice,
          amount,
          // betAmount: amount,
          result: "pending",
        });
        await betRecord.save();
        if (user.balance < amount) {
          return socket.emit("risefall_error", "Insufficient balance");
        }

        // // Deduct balance
        // await User.findByIdAndUpdate(userId, {
        //   $inc: { balance: -amount,

        //    },

        // });

        // Use lean for faster fetch (no Mongoose wrapper)
        const userDoc = await User.findById(userId)
          .select("balance bonusAmount bonusPlayedAmount")
          .lean();

        if (!userDoc) {
          return socket.emit("risefall_error", "User not found");
        }

        // Prepare updated values (logic offloaded here)
        const newBalance = userDoc.balance - amount;
        let updatedBonusAmount = userDoc.bonusAmount;
        let updatedBonusPlayed = userDoc.bonusPlayedAmount;

        if (userDoc.bonusAmount > 0) {
          if (userDoc.bonusAmount >= amount) {
            updatedBonusAmount -= amount;
            updatedBonusPlayed += amount;
          } else {
            updatedBonusPlayed += updatedBonusAmount;
            updatedBonusAmount = 0;
          }
        }

        // Update only required fields (atomic update)
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              balance: newBalance,
              bonusAmount: updatedBonusAmount,
              bonusPlayedAmount: updatedBonusPlayed,
            },
          }
        );

        // Record bet
        currentRound.players.push({ userId, choice, amount });
        currentRound.totals[choice] += amount;

        // Notify user
        socket.emit("risefall_betPlaced", { amount, choice });
        socket.emit("risefall_balanceUpdate", {
          balance: user.balance - amount,
        });
      } catch (error) {
        // console.log("error msg is ", error);
        console.error("Error placing bet:", error);
        socket.emit("risefall_error", "Failed to place bet");
      }
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected:", socket.id);
    });
  });

  // Start first round
  startNewRound();
}
