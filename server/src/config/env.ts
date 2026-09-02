import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "file:./prisma/dev.db",
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  PORT: parseInt(process.env.PORT || "4000", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
};
