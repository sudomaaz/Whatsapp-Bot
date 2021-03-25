import pkg from "@adiwajshing/baileys";
import fs from "fs";
import { botText, welcomeJson } from "./exports.js";

const { WAConnection, MessageType, MessageOptions, Mimetype, isGroupID } = pkg;

let conn;

const self = "917457963544@s.whatsapp.net";

async function connectToWhatsApp() {
  try {
    conn = new WAConnection(); // create a baileys connection object
    // this will be called as soon as the credentials are updated
    conn.on("open", () => {
      // save credentials whenever updated
      console.log(`credentials updated!`);
      const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
      fs.writeFileSync(
        "./auth_info.json",
        JSON.stringify(authInfo, null, "\t")
      ); // save this info to a file
    });

    conn.loadAuthInfo("./auth_info.json"); // will load JSON credentials from file

    // connect to whatsapp web
    await conn.connect();

    conn.on("chat-update", async (chatUpdate) => {
      if (chatUpdate.messages && chatUpdate.count) {
        const message = chatUpdate.messages.all()[0];
        const fromMe = message.key.fromMe;
        const mmid = message.key.remoteJid;
        if (fromMe) return;
        if (!isGroupID(mmid)) {
          const sentMsg = await conn.sendMessage(
            mmid,
            "Hello, Thanks for your message 😊 However , i only respond to messages in a group.Thanks.",
            MessageType.text,
            options
          );
          return;
        }
        if (
          message.message.extendedTextMessage === null ||
          message.message.extendedTextMessage === undefined
        )
          return;
        if (
          message.message.extendedTextMessage.contextInfo.mentionedJid[0] &&
          message.message.extendedTextMessage.contextInfo.mentionedJid[0] !==
            self
        )
          return;
      }
    });

    conn.on("group-participants-update", async (person) => {
      if (person.action === "remove") return;
      const groupMetaData = await conn.groupMetadata(person.jid);
      const gname = groupMetaData.subject;
      const gusers = groupMetaData.participants.length;
      const name = person.participants[0].split("@")[0];
      const uname = name === self.split("@")[0] ? "Everyone" : "@" + name;
      const replaceT = {
        gname: gname,
        gusers: gusers,
        uname: uname,
      };
      const addText = botText.replace(
        /gname|gusers|uname/gi,
        (matched) => replaceT[matched]
      );
      const options = {
        quoted: welcomeJson,
        contextInfo: {
          participant: "0@s.whatsapp.net",
          mentionedJid: [person.participants[0]],
        },
      };
      const sentMsg = await conn.sendMessage(
        person.jid,
        addText,
        MessageType.extendedText,
        options
      );
    });
  } catch (err) {
    console.log(err);
  }
}
// run in main file
connectToWhatsApp().catch((err) => console.log("unexpected error: " + err)); // catch any errors
