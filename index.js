import express from "express";
import bot from "./bot.js";

const app = express();

app.get("/", async (req, res) => {
  res.send("<h1>Welcome</h1>");
});

app.listen(process.env.PORT || 3000, async () => {
  await bot().catch((err) => console.log(err));
  console.log("server started");
});
