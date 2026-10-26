import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import auth from "./routes/auth.js";
import admissions from "./routes/admissions.js";
import halaqat from "./routes/halaqat.js";
import progress from "./routes/progress.js";
import billing from "./routes/billing.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", auth);
app.use("/api/admissions", admissions);
app.use("/api/halaqat", halaqat);
app.use("/api/progress", progress);
app.use("/api/billing", billing);

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: err.issues });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(process.env.PORT || 4000, () => console.log("API running on port", process.env.PORT || 4000));
