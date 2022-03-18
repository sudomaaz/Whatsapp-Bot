import express from "express";
import { connectAndRunBot as bot, robJobs } from "./bot.js";
import dotenv from "dotenv";
import axios from "axios";
import requestIp from "request-ip";
import { join, resolve } from "path";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

app.get("/", async (req, res) => {
  res.status(200).send("<h1>Welcome</h1>");
});

app.get("/bunny", async (req, res) => {
  res.sendFile(join(resolve(), "bunny.jpg"));
  const message = `Somene requested bunny image\n\n*Ip Address*: ${req.clientIp}`;
  await robJobs(message);
});

app.get("/start", async (req, res) => {
  await bot().catch((err) => console.log(err));
  res.status(200).send("<h1>Welcome</h1>");
});

app.listen(process.env.PORT || 3000, async () => {
  await bot().catch((err) => console.log(err));
  console.log("server started");
});
