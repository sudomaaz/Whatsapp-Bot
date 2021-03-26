import pkg from "@adiwajshing/baileys";
import fs from "fs";
import { botText, welcomeJson, self } from "./exports.js";

const {
  WAConnection,
  MessageType,
  MessageOptions,
  Mimetype,
  isGroupID,
  ReconnectMode,
  proto,
} = pkg;

const { RequestPaymentMessage } = proto;

let conn;

async function connectAndRunBot() {
  try {
    conn = new WAConnection(); // create a baileys connection object

    conn.autoReconnect = ReconnectMode.onConnectionLost; // only automatically reconnect when the connection breaks

    // attempt to reconnect at most 10 times in a row
    conn.connectOptions.maxRetries = 10;

    // will load JSON credentials from file and try to connect
    fs.existsSync("./auth_info.json") && conn.loadAuthInfo("./auth_info.json");
    // connect to whatsapp web
    await conn.connect();

    // this will be called as soon as the credentials are updated
    const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session

    fs.writeFileSync("./auth_info.json", JSON.stringify(authInfo, null, "\t")); // save this info to a file

    const payment = new RequestPaymentMessage(RequestPaymentMessage.amount1000);

    console.log(payment);

    // this will be called on every chat update event
    conn.on("chat-update", async (chatUpdate) => {
      if (chatUpdate.messages && chatUpdate.count) {
        const message = chatUpdate.messages.all()[0];
        //console.log(JSON.stringify(message, null, 5));
        const fromMe = message.key.fromMe;
        const mmid = message.key.remoteJid;
        await conn.chatRead(mmid);
        if (fromMe) return;
        if (!isGroupID(mmid)) {
          const sentMsg = await conn.sendMessage(
            mmid,
            "Hello, Thanks for your message 😊 However, i only respond to messages in a group.\n\nOur Official Group: *https://chat.whatsapp.com/BxiQo8aeYXVAvenCRa5tbd*",
            MessageType.text
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
        const fetchMsg = message.message.extendedTextMessage.text.split(" ");
        if (fetchMsg[1].toLowerCase() === "help") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const gname = groupMetaData.subject;
          const gusers = groupMetaData.participants.length;
          const uname = "@" + message.participant.split("@")[0];
          const replaceT = {
            gname: gname,
            gusers: gusers,
            uname: uname,
          };
          const text = botText.replace(
            /gname|gusers|uname/gi,
            (matched) => replaceT[matched]
          );
          const options = {
            quoted: message,
            contextInfo: {
              mentionedJid: [message.participant],
            },
          };
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
        } else if (fetchMsg[1].toLowerCase() === "donation") {
          const text =
            "Thank you for showing interest 😊 If you like me and want to see me grow kindly contact my owner Maaz for donation queries.\n\nIf you use BHIM UPI you can also send payments to *memset@icici* . Thank you.";
          const options = {
            quoted: message,
            contextInfo: {
              mentionedJid: [message.participant],
            },
          };
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
          const vcard =
            "BEGIN:VCARD\n" + // metadata of the contact card
            "VERSION:3.0\n" +
            "FN:Maaz\n" + // full name
            "TEL;type=CELL;type=VOICE;waid=918840081034:+918840081034\n" + // WhatsApp ID + phone number
            "END:VCARD";
          const sentMsg1 = await conn.sendMessage(
            mmid,
            { displayname: "Maaz", vcard: vcard },
            MessageType.contact
          );
        }
      } //end message process
    });

    //called when some group join/remove action occurs
    conn.on("group-participants-update", async (group) => {
      if (group.action === "remove") return;
      const groupMetaData = await conn.groupMetadata(group.jid);
      const gname = groupMetaData.subject;
      const gusers = groupMetaData.participants.length;
      if (
        group.jid !== "918840081034-1616171637@g.us" &&
        group.jid !== "917985376479-1484319380@g.us"
      ) {
        // const text = "Sorry! I only stay in a group with atleast 5 members 👋";
        const text = "I am under construction. Will be updated once active 👋";
        const sentMsg = await conn.sendMessage(
          group.jid,
          text,
          MessageType.text
        );
        await conn.groupLeave(group.jid);
        return;
      }
      const name = group.participants[0].split("@")[0];
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
          mentionedJid: [group.participants[0]],
        },
      };
      const sentMsg = await conn.sendMessage(
        group.jid,
        addText,
        MessageType.extendedText,
        options
      );
    });
  } catch (err) {
    return new Promise((resolve, reject) => reject(err));
  }
}
// run in main file
connectAndRunBot().catch((err) => console.log("unexpected error: " + err)); // catch any errors
