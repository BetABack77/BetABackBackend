// // import mongoose from "mongoose";

// // // const Round = mongoose.model("Round", {
// // //   roundId: String,
// // //   players: [{ userId: String, choice: String }],
// // //   result: String,
// // //   createdAt: Date,
// // // });

// // let currentRound = {
// //   roundId: Date.now().toString(),
// //   players: [],
// //   createdAt: new Date(),
// // };

// // export default function handleWebSocket(io) {
// //   io.on("connection", (socket) => {
// //     console.log("New client:", socket.id);

// //     socket.emit("currentRound", {
// //       roundId: currentRound.roundId,
// //       startedAt: currentRound.createdAt,
// //     });

// //     socket.on("joinRound", ({ userId, choice }) => {
// //       currentRound.players.push({ userId, choice });
// //       socket.emit("joinedRound", { roundId: currentRound.roundId });
// //     });
// //   });

// //   setInterval(async () => {
// //     const count = { head: 0, tail: 0 };
// //     currentRound.players.forEach((p) => count[p.choice]++);

// //     const result = count.head <= count.tail ? "head" : "tail";

// //     // const roundToSave = new Round({
// //     //   ...currentRound,
// //     //   result,
// //     // });
// //     // await roundToSave.save();

// //     io.emit("roundResult", {
// //       roundId: currentRound.roundId,
// //       result,
// //       players: currentRound.players,
// //     });

// //     currentRound = {
// //       roundId: Date.now().toString(),
// //       players: [],
// //       createdAt: new Date(),
// //     };

// //     io.emit("newRound", {
// //       roundId: currentRound.roundId,
// //       startedAt: currentRound.createdAt,
// //     });
// //   }, 60000); // 1-minute interval
// // }

// import { User } from "../model/User.model.js";
// import mongoose from "mongoose";

// let currentRound = {
//   roundId: Date.now().toString(),
//   players: [],
//   createdAt: new Date(),
// };

// export default function handleWebSocket(io) {
//   io.on("connection", (socket) => {
//     console.log("New client connected:", socket.id);

//     // Send current round info to the new client
//     socket.emit("currentRound", {
//       roundId: currentRound.roundId,
//       startedAt: currentRound.createdAt,
//     });

//     // Handle bet placement
//     socket.on("placeBet", async ({ userId, choice, amount, roundId }) => {
//       try {
//         // Verify the round is still active
//         if (roundId !== currentRound.roundId) {
//           socket.emit("error", "This round has already ended");
//           return;
//         }

//         // Verify user has enough balance
//         const user = await User.findById(userId);
//         if (!user) {
//           socket.emit("error", "User not found");
//           return;
//         }

//         if (user.balance < amount) {
//           socket.emit("error", "Insufficient balance");
//           return;
//         }

//         console.log("user data is before balance minuse", user.balance);

//         // Deduct balance from user
//         user.balance -= amount;
//         if (user.balance < 0) {
//           socket.emit("error", "Insufficient balance after deduction");
//           return;
//         }

//         console.log("user data is after balance minuse", user.balance);
//         await user.save();

//         // Add to current round
//         currentRound.players.push({ userId, choice, amount });

//         socket.emit("betPlaced", { amount, choice });
//         socket.emit("balanceUpdate", { balance: user.balance });
//       } catch (error) {
//         console.error("Error placing bet:", error);
//         socket.emit("error", "Failed to place bet");
//       }
//     });
//   });

//   // Round processing interval
//   setInterval(async () => {
//     if (currentRound.players.length === 0) {
//       // No players in this round, just start a new one
//       currentRound = {
//         roundId: Date.now().toString(),
//         players: [],
//         createdAt: new Date(),
//       };
//       io.emit("newRound", {
//         roundId: currentRound.roundId,
//         startedAt: currentRound.createdAt,
//       });
//       return;
//     }

//     // Determine result (50/50 chance)
//     const result = Math.random() < 0.5 ? "head" : "tail";

//     // Process winners and update balances
//     const winners = currentRound.players.filter((p) => p.choice === result);
//     const updatePromises = winners.map(async (player) => {
//       try {
//         const user = await User.findById(player.userId);
//         if (user) {
//           // Pay 1.95x the bet amount (5% house edge)
//           const payout = player.amount * 1.95;
//           user.balance += payout;
//           await user.save();

//           // Update the player record with payout
//           player.payout = payout;

//           // Notify the user
//           io.to(player.userId.toString()).emit("balanceUpdate", {
//             balance: user.balance,
//             win: true,
//             amount: payout,
//           });
//         }
//       } catch (error) {
//         console.error(
//           `Error processing payout for user ${player.userId}:`,
//           error
//         );
//       }
//     });

//     await Promise.all(updatePromises);

//     // Save round result (you would save to database here)
//     currentRound.result = result;

//     // Broadcast result
//     io.emit("roundResult", {
//       roundId: currentRound.roundId,
//       result,
//       players: currentRound.players,
//     });

//     // Start new round
//     currentRound = {
//       roundId: Date.now().toString(),
//       players: [],
//       createdAt: new Date(),
//     };

//     io.emit("newRound", {
//       roundId: currentRound.roundId,
//       startedAt: currentRound.createdAt,
//     });
//   }, 60000); // 1-minute rounds
// }

import { User } from "../model/User.model.js";
import mongoose from "mongoose";
import { UserBetHistory } from "../model/UserBetHistory.model.js";

let currentRound = {
  roundId: Date.now().toString(),
  players: [],
  createdAt: new Date(),
  totals: { head: 0, tail: 0 }, // track total bet amounts
};

let RoomName = "";

export default function handleWebSocket(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Track connected socket
    socket.on("registerUser", (roomName) => {
      RoomName = roomName;
      console.log("User registered:", roomName);
      socket.join(roomName); // join room even if user didn't bet

      io.to(roomName).emit("userRegistered", roomName);
    });

    socket.emit("currentRound", {
      roundId: currentRound.roundId,
      startedAt: currentRound.createdAt,
    });

    // socket.on("placeBet", async ({ userId, choice, amount, roundId }) => {
    //   try {
    //     if (roundId !== currentRound.roundId) {
    //       socket.emit("error", "This round has already ended");
    //       return;
    //     }
    //     socket.join(userId.toString());

    //     const user = await User.findById(userId);
    //     if (!user) {
    //       socket.emit("error", "User not found");
    //       return;
    //     }

    //     if (user.balance < amount) {
    //       socket.emit("error", "Insufficient balance");
    //       return;
    //     }

    //     // user.balance -= amount;

    //     user.balance -= amount; // Always deduct full amount from balance

    //     if (user.bonusAmount > 0) {
    //       if (user.bonusAmount >= amount) {
    //         // Case 1: Bonus is more than or equal to amount
    //         user.bonusAmount -= amount;
    //         user.bonusPlayedAmount += amount;
    //       } else {
    //         // Case 2: Bonus is less than amount
    //         user.bonusPlayedAmount += user.bonusAmount;
    //         user.bonusAmount = 0;
    //       }
    //     }

    //     await user.save();

    //     // Update round info
    //     currentRound.players.push({ userId, choice, amount });
    //     // Add to total amount per choice
    //     currentRound.totals[choice] += amount;

    //     socket.emit("betPlaced", { amount, choice });
    //     socket.emit("balanceUpdate", { balance: user.balance });
    //   } catch (error) {
    //     console.error("Error placing bet:", error);
    //     socket.emit("error", "Failed to place bet");
    //   }
    // });

    socket.on("placeBet", async ({ userId, choice, amount, roundId }) => {
      try {
        if (roundId !== currentRound.roundId) {
          return socket.emit("error", "This round has already ended");
        }

        // Create bet history record
        const betRecord = new UserBetHistory({
          userId,
          roundId,
          choice,
          amount,
          // betAmount: amount,
          result: "pending",
        });
        await betRecord.save();
        // Join user-specific room to send private messages
        socket.join(userId.toString());

        // Use lean for faster fetch (no Mongoose wrapper)
        const userDoc = await User.findById(userId)
          .select("balance bonusAmount bonusPlayedAmount")
          .lean();

        if (!userDoc) {
          return socket.emit("error", "User not found");
        }

        // Check balance before processing
        if (userDoc.balance < amount) {
          return socket.emit("error", "Insufficient balance");
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

        // ✅ Store player info (in-memory only)
        currentRound.players.push({ userId, choice, amount });
        currentRound.totals[choice] += amount;

        // ✅ Respond immediately to frontend
        socket.emit("betPlaced", { amount, choice });
        socket.emit("balanceUpdate", { balance: newBalance });
      } catch (error) {
        console.error("Error placing bet:", error);
        socket.emit("error", "Something went wrong. Try again.");
      }
    });
  });

  setInterval(async () => {
    // if (currentRound.players.length === 0) {
    //   // No bets - start a new round
    //   currentRound = {
    //     roundId: Date.now().toString(),
    //     players: [],
    //     createdAt: new Date(),
    //     totals: { head: 0, tail: 0 },
    //   };
    //   io.emit("newRound", {
    //     roundId: currentRound.roundId,
    //     startedAt: currentRound.createdAt,
    //   });
    //   return;
    // }

    // Determine winning side: one with less total amount
    const { head, tail } = currentRound.totals;
    let result = null;

    result = Math.random() < 0.5 ? "head" : "tail"; // tie → random
    // result = "head";
    // if (head === tail) {
    //   result = Math.random() < 0.5 ? "head" : "tail"; // tie → random
    // } else {
    //   result = head < tail ? "head" : "tail";
    //   // result = "head";
    // }

    // 2. Get all pending bets for this round
    const pendingBets = await UserBetHistory.find({
      roundId: currentRound.roundId,
      result: "pending",
    });

    // 3. Process each bet
    const bulkUpdates = [];
    // const winners = [];

    for (const bet of pendingBets) {
      const isWinner = bet.choice === result;
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

    const winners = currentRound.players.filter((p) => p.choice === result);
    const updatePromises = winners.map(async (player) => {
      try {
        const user = await User.findById(player.userId);
        if (user) {
          const payout = player.amount * 1.95;
          user.balance += payout;
          await user.save();

          player.payout = payout;
        }
      } catch (error) {
        console.error(
          `Error processing payout for user ${player.userId}:`,
          error
        );
      }
    });

    await Promise.all(updatePromises);

    // Emit round result to all clients
    // io.emit("roundResult", {
    //   roundId: currentRound.roundId,
    //   result,
    //   players: currentRound.players,
    //   totals: currentRound.totals,
    // });

    // io.to(RoomName).emit("roundResultToAll", {
    //   roundId: currentRound.roundId,
    //   result,
    //   players: currentRound.players,
    //   totals: currentRound.totals,

    // });

    // console.log("RoomName", RoomName);

    // Send win notification AFTER all updates
    // winners.forEach((player) => {
    //   if (player.payout) {
    //     io.to(RoomName).emit("wonMessage", {
    //       message: `🎉 You won ₹${player.payout.toFixed(2)}!`,
    //       amount: player.payout,
    //     });
    //   }
    // });

    io.to(RoomName).emit("roundResultToAll", {
      room: RoomName, // Add this
      roundId: currentRound.roundId,
      result,
      players: currentRound.players,
      totals: currentRound.totals,
    });

    currentRound.players.forEach((player) => {
      const isWinner = player.choice === result;

      if (isWinner) {
        const winAmount = player.amount * 1.95;
        io.to(player.userId.toString()).emit("roundOutcome", {
          result: "win",
          choice: player.choice,
          winningSide: result,
          amount: winAmount,
          message: `🎉 You won ₹${winAmount.toFixed(2)}!`,
        });
      } else {
        io.to(player.userId.toString()).emit("roundOutcome", {
          result: "lose",
          choice: player.choice,
          winningSide: result,
          amount: 0,
          message: `😢 You lost this round!`,
        });
      }
    });

    // Start new round
    currentRound = {
      roundId: Date.now().toString(),
      players: [],
      createdAt: new Date(),
      totals: { head: 0, tail: 0 },
    };

    io.emit("newRound", {
      roundId: currentRound.roundId,
      startedAt: currentRound.createdAt,
    });
  }, 30000); // every minute
}
