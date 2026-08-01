import express from "express";
import cors from "cors";
import { getCurrentEvent } from "./sequence";

const app = express();
app.use(cors());

app.get("/api/events", (_req, res) => {
  res.json(getCurrentEvent());
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`surveil backend listening on port ${PORT}`);
});
