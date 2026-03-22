import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";
import routes from "./routes";
import { errorHandler, notFound } from "./middleware/error.middleware";
import dealerRoutes from "./routes/dealer.route";


const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1", routes);
app.use("/api/v1/dealers", dealerRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
