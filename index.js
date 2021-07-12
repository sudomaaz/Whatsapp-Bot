import express from "express";
import bot from "./bot.js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.status(200).send("<h1>Welcome</h1>");
});

app.get("/webhook", async (req, res) => {
  console.log("in get request");
  console.log(req.body);
});

app.post("/webhook", async (req, res) => {
  console.log("in post request");
  console.log(req.body);
});

app.get("/start", async (req, res) => {
  await bot().catch((err) => console.log(err));
  res.status(200).send("<h1>Welcome</h1>");
});

app.listen(process.env.PORT || 3000, async () => {
  await bot().catch((err) => console.log(err));
  console.log("server started");
});
