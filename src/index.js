// import http, { Server } from "http";

// import app from "./app.js";

// import dotenv from "dotenv";

// const server = http.createServer(app);

// dotenv.config();

// const port = process.env.PORT || 3000;

// server.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

import http from "http";
import { Server } from "socket.io";
import app from "./app.js"; // ✅ default import
import { connectDb } from "./config/connectDb.js";
import handleWebSocket from "./socket/websocketLogic.js";
import { getRandomAvatar } from "./utils/avatarGenerator.js";
import handleWheelGame from "./socket/wheelGameSocket.js";
// import setupTradingWebSocket from "./socket/ForexTreeWebsocket.js";
import setupTradingWebSocket from "./socket/ForexTreeWebsocket.js";


const server = http.createServer(app); // ✅ app is a function
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"," PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    // credentials: true,
    
  },
});

// console.log(getRandomAvatar()); // Call the function to generate a random avatar URL
connectDb();
handleWebSocket(io);
handleWheelGame(io);
setupTradingWebSocket(io);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
