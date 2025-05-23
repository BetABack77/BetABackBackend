// import { User } from "../model/User.model.js";

// export default function handleWheelGame(io) {

//   io.on("connection", (socket) => {
//     console.log("Wheel game: user connected", socket.id);

//     // Track active rooms
//     const userRooms = new Map();

//     socket.on("joinWheelGame", ({ userId, roomName }) => {
//       try {
//         socket.join(roomName);
//         userRooms.set(socket.id, roomName);
//         console.log(`User ${userId} joined wheel room ${roomName}`);
//       } catch (err) {
//         console.error("Error joining wheel room:", err);
//       }
//     });

//     socket.on("spinWheel", async ({ userId, amount, roomName }) => {
//       try {
//         const user = await User.findById(userId).lean();
//         if (!user) {
//           socket.emit("wheelError", { message: "User not found" });
//           return;
//         }

//         if (user.balance < amount) {
//           socket.emit("wheelError", { message: "Insufficient balance" });
//           return;
//         }

//         // Deduct balance first (atomic operation)
//         const updatedUser = await User.findByIdAndUpdate(
//           userId,
//           { $inc: { balance: -amount } },
//           { new: true }
//         ).lean();

//         // Determine wheel result based on specified probabilities
//         const result = getWheelResult();
//         const winnings = amount * result.multiplier;

//         // If won, add winnings (atomic operation)
//         if (winnings > 0) {
//           await User.findByIdAndUpdate(
//             userId,
//             { $inc: { balance: winnings } },
//             { new: true }
//           );
//         }

//         // Broadcast result to room
//         io.to(roomName).emit("wheelResult", {
//           userId,
//           amount,
//           result: result.label,
//           multiplier: result.multiplier,
//           wonAmount: winnings,
//           finalBalance: updatedUser.balance + winnings,
//           timestamp: new Date(),
//         });

//       } catch (err) {
//         console.error("Wheel game error:", err);
//         socket.emit("wheelError", { message: "Something went wrong" });
//       }
//     });

//     socket.on("disconnect", () => {
//       const roomName = userRooms.get(socket.id);
//       if (roomName) {
//         socket.leave(roomName);
//         userRooms.delete(socket.id);
//       }
//     });
//   });
// }

// // Helper function to get wheel result with specified probabilities
// function getWheelResult() {
//   const random = Math.random();

//   // Probability distribution:
//   if (random < 0.4) return { label: "1x", multiplier: 1 };      // 40%
//   if (random < 0.6) return { label: "0x", multiplier: 0 };      // 20%
//   if (random < 0.8) return { label: "1.5x", multiplier: 1.5 };  // 20%
//   if (random < 0.95) return { label: "2x", multiplier: 2 };     // 15%
//   if (random < 0.98) return { label: "3x", multiplier: 3 };     // 3%
//   return { label: "5x", multiplier: 5 };                       // 2%
// }

import { User } from "../model/User.model.js";

let RoomName = ""; // Global variable to store room name

export default function handleWheelGame(io) {
  io.on("connection", (socket) => {
    socket.on("registerUser", (roomName) => {
      RoomName = roomName;
      console.log("User registered:", roomName);
      socket.join(roomName);
      io.to(roomName).emit("userRegistered", roomName);
    });

    // ✅ Move this inside the connection handler
    socket.on("spinWheel", async ({ userId, amount }) => {
      try {
        // const user = await User.findById(userId);
        // console.log("user is ",user);
        // if (!user) {
        //   socket.emit("wheelError", { message: "User not found" });
        //   return;
        // }

        // if (user.balance < amount) {
        //   socket.emit("wheelError", { message: "Insufficient balance" });
        //   return;
        // }

        // // Deduct balance first
        // user.balance -= amount;
        // await user.save();

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

        // Determine wheel result with specified probabilities
        const result = getWheelResult();
        const winnings = amount * result.multiplier;

        // If won, add winnings
        // if (winnings > 0) {
        //   userDoc.balance += winnings;
        //   await userDoc.save();
        // }

        if (winnings > 0) {
          await User.updateOne(
            { _id: userId },
            { $inc: { balance: winnings } }
          );
        }

        // Send result back to user
        socket.emit("wheelResult", {
          amount,
          result: result.label,
          multiplier: result.multiplier,
          wonAmount: winnings,
          finalBalance: userDoc.balance,
        });
      } catch (err) {
        console.error("Wheel game error:", err);
        socket.emit("wheelError", { message: "Something went wrong" });
      }
    });
  });
}

// Function to determine the spin result
// function getWheelResult() {
//   const random = Math.random();

//   if (random < 0.4) return { label: "1x", multiplier: 1 };
//   if (random < 0.6) return { label: "0x", multiplier: 0 };
//   if (random < 0.8) return { label: "1.5x", multiplier: 1.5 };
//   if (random < 0.95) return { label: "2x", multiplier: 2 };
//   if (random < 0.98) return { label: "3x", multiplier: 3 };
//   return { label: "5x", multiplier: 5 };
// }

// function getWheelResult() {
//   const random = Math.random();

//   if (random < 0.3) return { label: "1x", multiplier: 1 }; // 30%
//   if (random < 0.6) return { label: "0x", multiplier: 0 }; // 30%
//   if (random < 0.8) return { label: "1.5x", multiplier: 1.5 }; // 20%
//   if (random < 0.96) return { label: "2x", multiplier: 2 }; // 16%
//   if (random < 0.98) return { label: "3x", multiplier: 3 }; // 2%
//   return { label: "5x", multiplier: 5 }; // 2%
// }

function getWheelResult() {
  const random = Math.random();

  if (random < 0.4) return { label: "1x", multiplier: 1 }; // 40%
  if (random < 0.8) return { label: "0x", multiplier: 0 }; // 40%
  if (random < 0.9) return { label: "1.5x", multiplier: 1.5 }; // 10%
  if (random < 0.95) return { label: "2x", multiplier: 2 }; // 5%
  if (random < 0.975) return { label: "3x", multiplier: 3 }; // 2.5%
  return { label: "5x", multiplier: 5 }; // 2.5%
}
