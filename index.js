import express from "express";
import bot from "./bot.js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.get("/", async (req, res) => {
  res.status(200).send("<h1>Welcome</h1>");
});

app.get("/webhook", async (req, res) => {
  const data = {
    url: "https://wa-node.herokuapp.com/webhook",
    enabled: true,
  };
  const headers = {
    headers: {
      Authorization: `bearer ${process.env.FORM_TOKEN}`,
    },
  };
  const response = await axios
    .put(
      `https://api.typeform.com/forms/${process.env.FORM_ID}/webhooks/wabot`,
      data,
      headers
    )
    .catch((err) => {
      console.log(err);
      res.status(400).send("Some error occured");
    });
  res.status(200).json(response);
});

app.get("/get", async (req, res) => {
  const webhook = {
    url: "https://wa-node.herokuapp.com/webhook",
    enabled: true,
  };
  const headers = {
    headers: {
      Authorization: `bearer ${process.env.FORM_TOKEN}`,
    },
  };
  const { data } = await axios
    .get(
      `https://api.typeform.com/forms/${process.env.FORM_ID}/webhooks`,
      headers
    )
    .catch((err) => {
      console.log(err);
      res.status(400).send("Some error occured");
    });
  res.status(200).send(data);
});

app.get("/start", async (req, res) => {
  await bot().catch((err) => console.log(err));
  res.status(200).send("<h1>Welcome</h1>");
});

app.listen(process.env.PORT || 3000, async () => {
  await bot().catch((err) => console.log(err));
  console.log("server started");
});
