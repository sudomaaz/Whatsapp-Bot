import pkg from "@adiwajshing/baileys";
import fs from "fs";
import { botText } from "./exports.js";

const { WAConnection, MessageType, MessageOptions, Mimetype, isGroupID } = pkg;

let conn;

async function connectToWhatsApp() {
  conn = new WAConnection(); // create a baileys connection object
  // this will be called as soon as the credentials are updated
  conn.on("open", () => {
    // save credentials whenever updated
    console.log(`credentials updated!`);
    const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
    fs.writeFileSync("./auth_info.json", JSON.stringify(authInfo, null, "\t")); // save this info to a file
  });

  conn.loadAuthInfo("./auth_info.json"); // will load JSON credentials from file

  // connect to whatsapp web
  await conn.connect();

  conn.on("group-participants-update", async (person) => {
    const sentMsg = await conn.sendMessage(
      person.jid,
      botText,
      MessageType.text
    );
    console.log(sentMsg);
  });
}
// run in main file
connectToWhatsApp().catch((err) => console.log("unexpected error: " + err)); // catch any errors
