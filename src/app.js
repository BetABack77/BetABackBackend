import express from "express";
import { connectDb } from "./config/connectDb.js";

import cors from "cors"; // Import CORS package
import dotenv from "dotenv";
// import authRoute from "./router/auth.route";
import fileUpload from "express-fileupload";
import authRoute from "./router/auth.route.js";
import userRoute from "./router/user.route.js";
import adminRoute from "./router/admin.route.js";
import http, { Server } from "http";
import handleWebSocket from "./socket/websocketLogic.js";
dotenv.config(); // Load environment variables from .env file

// import userRoute from "./router/user.route";

// Create an instance of the Express application
const app = express();

// Connect to the database
connectDb();

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);

// Define CORS options based on environment variables
const corsOptions = {
  // origin: process.env.CORS_ORIGIN || '*',  // Allow all origins by default if CORS_ORIGIN is not defined
  origin: "*", // Allow all origins by default if CORS_ORIGIN is not defined
  methods: "GET, POST, PUT, DELETE", // Allowed HTTP methods
  allowedHeaders: "Content-Type, Authorization", // Allowed headers
  credentials: true, // Allow credentials (cookies, authorization headers)
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Middleware to parse JSON requests
app.use(express.json());

app.post("/test-upload", (req, res) => {
  console.log("req.files", req.files?.java);
  // res.json({ files: req.files });
  res.json({ file: req.files?.java });
});

// Set up routes
app.use("/api/v1/user", userRoute); // User routes
app.use("/api/v1/auth", authRoute); // Auth routes
app.use("/api/v1/admin", adminRoute); // Auth routes

// Basic root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get('/api/v1/ping', (req, res) => {
  res.send("Backend awake!");
});


// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

export default app; // Export the app instance
