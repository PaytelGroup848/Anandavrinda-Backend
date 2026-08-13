const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

// Load env vars
dotenv.config();

// Import routes
const routes = require("./src/routes");
const cartRoutes = require("./src/routes/v1/cart.routes");

// Import error handler
const { errorHandler } = require("./src/middlewares/errorHandler");

const app = express();

// Connect to database
mongoose
  .connect(
    "mongodb://datacloude8_db_user:6fD3ao7TUd3EgiPP@ac-hhfjvfw-shard-00-00.d1c6qk4.mongodb.net:27017,ac-hhfjvfw-shard-00-01.d1c6qk4.mongodb.net:27017,ac-hhfjvfw-shard-00-02.d1c6qk4.mongodb.net:27017/?ssl=true&replicaSet=atlas-efmajk-shard-0&authSource=admin&appName=NewQubanHc",
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  "https://qubanhygienecare.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log("Blocked origin:", origin);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

app.options("/", cors());

// ========== REQUEST BODY ==========
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// ========== SECURITY ==========
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

// ========== RATE LIMIT ==========
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// ========== LOGGING ==========
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ========== CREATE UPLOADS DIRECTORY ==========
const uploadsDir = path.join(__dirname, "uploads");
const productsDir = path.join(uploadsDir, "products");
const categoriesDir = path.join(uploadsDir, "categories");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });
if (!fs.existsSync(categoriesDir))
  fs.mkdirSync(categoriesDir, { recursive: true });

// ========== STATIC FILES ==========
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// ========== HEALTH CHECKS ==========
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "OK", version: "1.0.0" });
});

// ========== API ROUTES ==========
// Direct mount first. This guarantees /api/v1/cart/summary works even if index.js has a mistake.
app.use("/api/v1/cart", cartRoutes);

// Main route index mount.
app.use("/api/v1", routes);

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Cannot find " + req.originalUrl + " on this server",
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  console.log("CORS enabled for origins:", allowedOrigins);
});
