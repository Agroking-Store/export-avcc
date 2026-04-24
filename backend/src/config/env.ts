import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;
  CORS_ORIGIN: string;
  UPLOAD_PATH: string;
  MAX_FILE_SIZE: number;
  OCR_API_KEY?: string;
  CURRENCY_API_KEY?: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

const getNodeEnv = (): "development" | "production" | "test" => {
  const value = getEnvVariable("NODE_ENV", "development");

  if (value !== "development" && value !== "production" && value !== "test") {
    throw new Error(`Invalid NODE_ENV: ${value}`);
  }

  return value;
};

export const config: EnvConfig = {
  NODE_ENV: getNodeEnv(),
  PORT: parseInt(getEnvVariable("PORT", "5000"), 10),
  MONGODB_URI: getEnvVariable(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017/export-avcc",
  ),
  JWT_SECRET: getEnvVariable("JWT_SECRET", "export-avcc-dev-secret"),
  JWT_EXPIRE: getEnvVariable("JWT_EXPIRE", "1d"),
  JWT_REFRESH_SECRET: getEnvVariable(
    "JWT_REFRESH_SECRET",
    "export-avcc-dev-refresh-secret",
  ),
  JWT_REFRESH_EXPIRE: getEnvVariable("JWT_REFRESH_EXPIRE", "7d"),
  CORS_ORIGIN: getEnvVariable("CORS_ORIGIN", "http://localhost:5173"),
  UPLOAD_PATH: getEnvVariable("UPLOAD_PATH", "./uploads"),
  MAX_FILE_SIZE: parseInt(getEnvVariable("MAX_FILE_SIZE", "5242880"), 10),
};
