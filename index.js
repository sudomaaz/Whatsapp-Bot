import express from "express";
import { connectAndRunBot as bot, robJobs } from "./bot.js";
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
  res.status(200).send("1");
  let message = "*A new form has been submitted*\n\n";
  data.form_response.definition.fields.forEach((e, i) => {
    const key = data.form_response.answers[i].type.toString();
    const ans = data.form_response.answers[i][key];
    console.log(e);
    if (ans) message += `*e.title* + \n + *ans* + \n\n`;
  });
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
