import express from "express";
import bot from "./bot.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get("/", async (req, res) => {
  res.status(200).send("<h1>Welcome</h1>");
});

app.get("/start", async (req, res) => {
  await bot().catch((err) => console.log(err));
  res.status(200).send("<h1>Welcome</h1>");
});

app.listen(process.env.PORT || 3000, async () => {
  await bot().catch((err) => console.log(err));
  console.log("server started");
  console.log(process.cwd());
});
