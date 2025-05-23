// import { User } from "../model/User.model.js";
// import mongoose from "mongoose";

// let RoomName = "";

// let currentRound = {
//   roundId: Date.now().toString(),
//   players: [],
//   createdAt: new Date(),
//   totals: { up: 0, down: 0 },
//   result: null,
//   endedAt: null,
// };

// export default function setupTradingWebSocket(io) {
//   io.on("connection", (socket) => {
//     console.log("New client connected:", socket.id);

//     // Track connected socket
//     socket.on("registerUser", (roomName) => {
//       RoomName = roomName;
//       console.log("User registered:", roomName);
//       socket.join(roomName); // join room even if user didn't bet

//       io.to(roomName).emit("userRegistered", roomName);
//     });

//     // Handle bet placement
//     socket.on("placeBet", async ({ userId, choice, amount, roundId }) => {
//       try {
//         if (roundId !== currentRound.roundId) {
//           return socket.emit("error", "This round has already ended");
//         }

//         // Join user-specific room to send private messages
//         socket.join(userId.toString());

//         // Use lean for faster fetch (no Mongoose wrapper)
//         const userDoc = await User.findById(userId)
//           .select("balance bonusAmount bonusPlayedAmount")
//           .lean();

//         if (!userDoc) {
//           return socket.emit("error", "User not found");
//         }

//         // Check balance before processing
//         if (userDoc.balance < amount) {
//           return socket.emit("error", "Insufficient balance");
//         }

//         // Prepare updated values (logic offloaded here)
//         const newBalance = userDoc.balance - amount;
//         let updatedBonusAmount = userDoc.bonusAmount;
//         let updatedBonusPlayed = userDoc.bonusPlayedAmount;

//         if (userDoc.bonusAmount > 0) {
//           if (userDoc.bonusAmount >= amount) {
//             updatedBonusAmount -= amount;
//             updatedBonusPlayed += amount;
//           } else {
//             updatedBonusPlayed += updatedBonusAmount;
//             updatedBonusAmount = 0;
//           }
//         }

//         // Update only required fields (atomic update)
//         await User.updateOne(
//           { _id: userId },
//           {
//             $set: {
//               balance: newBalance,
//               bonusAmount: updatedBonusAmount,
//               bonusPlayedAmount: updatedBonusPlayed,
//             },
//           }
//         );

//         // ✅ Store player info (in-memory only)
//         currentRound.players.push({ userId, choice, amount });
//         currentRound.totals[choice] += amount;

//         // ✅ Respond immediately to frontend
//         socket.emit("betPlaced", { amount, choice });
//         socket.emit("balanceUpdate", { balance: newBalance });
//       } catch (error) {
//         console.error("Error placing bet:", error);
//         socket.emit("error", "Something went wrong. Try again.");
//       }
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//       console.log("Client disconnected:", socket.id);
//     });
//   });

//   setInterval(async () => {
//     // if (currentRound.players.length === 0) {
//     //   // No bets - start a new round
//     //   currentRound = {
//     //     roundId: Date.now().toString(),
//     //     players: [],
//     //     createdAt: new Date(),
//     //     totals: { up: 0, down: 0 },
//     //   };
//     //   io.emit("newRound", {
//     //     roundId: currentRound.roundId,
//     //     startedAt: currentRound.createdAt,
//     //   });
//     //   return;
//     // }

//     // Determine winning side: one with less total amount
//     const { up, down } = currentRound.totals;
//     let result = null;

//     result = Math.random() < 0.5 ? "up" : "down"; // tie → random
//     // result = "up";
//     // if (up === down) {
//     //   result = Math.random() < 0.5 ? "up" : "down"; // tie → random
//     // } else {
//     //   result = up < down ? "up" : "down";
//     //   // result = "up";
//     // }

//     const winners = currentRound.players.filter((p) => p.choice === result);
//     const updatePromises = winners.map(async (player) => {
//       try {
//         const user = await User.findById(player.userId);
//         if (user) {
//           const payout = player.amount * 1.95;
//           user.balance += payout;
//           await user.save();

//           player.payout = payout;
//         }
//       } catch (error) {
//         console.error(
//           `Error processing payout for user ${player.userId}:`,
//           error
//         );
//       }
//     });

//     await Promise.all(updatePromises);

//     // Emit round result to all clients
//     // io.emit("roundResult", {
//     //   roundId: currentRound.roundId,
//     //   result,
//     //   players: currentRound.players,
//     //   totals: currentRound.totals,
//     // });

//     // io.to(RoomName).emit("roundResultToAll", {
//     //   roundId: currentRound.roundId,
//     //   result,
//     //   players: currentRound.players,
//     //   totals: currentRound.totals,

//     // });

//     // console.log("RoomName", RoomName);

//     // Send win notification AFTER all updates
//     // winners.forEach((player) => {
//     //   if (player.payout) {
//     //     io.to(RoomName).emit("wonMessage", {
//     //       message: `🎉 You won ₹${player.payout.toFixed(2)}!`,
//     //       amount: player.payout,
//     //     });
//     //   }
//     // });

//     io.to(RoomName).emit("roundResultToAll", {
//       room: RoomName, // Add this
//       roundId: currentRound.roundId,
//       result,
//       players: currentRound.players,
//       totals: currentRound.totals,
//     });

//     currentRound.players.forEach((player) => {
//       const isWinner = player.choice === result;

//       if (isWinner) {
//         const winAmount = player.amount * 1.95;
//         io.to(player.userId.toString()).emit("roundOutcome", {
//           result: "win",
//           choice: player.choice,
//           winningSide: result,
//           amount: winAmount,
//           message: `🎉 You won ₹${winAmount.toFixed(2)}!`,
//         });
//       } else {
//         io.to(player.userId.toString()).emit("roundOutcome", {
//           result: "lose",
//           choice: player.choice,
//           winningSide: result,
//           amount: 0,
//           message: `😢 You lost this round!`,
//         });
//       }
//     });

//     // Start new round
//     currentRound = {
//       roundId: Date.now().toString(),
//       players: [],
//       createdAt: new Date(),
//       totals: { up: 0, down: 0 },
//     };

//     io.emit("newRound", {
//       roundId: currentRound.roundId,
//       startedAt: currentRound.createdAt,
//     });
//   }, 30000); // every minute
// }

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
    io.emit("newRound", {
      roundId: currentRound.roundId,
      startedAt: currentRound.createdAt,
      history: roundHistory.slice(-5), // Send last 5 rounds for display
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
    io.emit("roundResult", {
      roundId: currentRound.roundId,
      result: currentRound.result,
      totals: currentRound.totals,
      history: roundHistory.slice(-5),
    });

    // Notify individual players
    currentRound.players.forEach((player) => {
      const isWinner = player.choice === currentRound.result;
      const winAmount = isWinner ? player.amount * 1.95 : 0;

      io.to(player.userId.toString()).emit("roundOutcome", {
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
    console.log("New client connected:", socket.id);

    // Register user and join room
    socket.on("registerUser", (userId) => {
      if (!userId) return;

      socket.join(userId.toString());
      socket.join("updownGame");

      // Send current game state to newly connected user
      socket.emit("gameState", {
        currentRound: {
          roundId: currentRound.roundId,
          startedAt: currentRound.createdAt,
          timeLeft: Math.max(
            0,
            ROUND_DURATION - (Date.now() - currentRound.createdAt.getTime())
          ),
        },
        history: roundHistory.slice(-5),
      });
    });

    // Handle bet placement
    socket.on("placeBet", async ({ userId, choice, amount }) => {
      try {
        // Validate
        if (currentRound.endedAt) {
          return socket.emit("error", "Round has ended");
        }
        if (!["up", "down"].includes(choice)) {
          return socket.emit("error", "Invalid choice");
        }
        if (isNaN(amount) || amount < 1) {
          return socket.emit("error", "Invalid amount");
        }

        // Check balance
        const user = await User.findById(userId);
        if (!user) return socket.emit("error", "User not found");

        const betRecord = new UserBetHistory({
          gameType: "ForexTree",
          userId,
          roundId:currentRound.roundId,
          choice,
          amount,
          // betAmount: amount,
          result: "pending",
        });
        await betRecord.save();
        if (user.balance < amount) {
          return socket.emit("error", "Insufficient balance");
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
          return socket.emit("error", "User not found");
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
        socket.emit("betPlaced", { amount, choice });
        socket.emit("balanceUpdate", { balance: user.balance - amount });
      } catch (error) {
        console.log("error msg is ", error);
        console.error("Error placing bet:", error);
        socket.emit("error", "Failed to place bet");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Start first round
  startNewRound();
}
