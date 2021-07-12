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

app.post("/webhook", async (req, res) => {
  const data = req.body;
  console.log(data.form_response.definition.fields);
  res.status(200).send(data.form_response.answers);
});

app.get("/start", async (req, res) => {
  await bot().catch((err) => console.log(err));
  res.status(200).send("<h1>Welcome</h1>");
});

app.listen(process.env.PORT || 3000, async () => {
  await bot().catch((err) => console.log(err));
  console.log("server started");
});
