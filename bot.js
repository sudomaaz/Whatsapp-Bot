import pkg from "@adiwajshing/baileys";
import e from "express";
import fs from "fs";
import * as fnc from "./exports.js";
import util from "util";

const {
  WAConnection,
  MessageType,
  MessageOptions,
  Mimetype,
  isGroupID,
  ReconnectMode,
  GroupSettingChange,
  WA_DEFAULT_EPHEMERAL,
  proto,
} = pkg;

let conn;

async function connectAndRunBot() {
  try {
    conn = new WAConnection(); // create a baileys connection object

    conn.version = [3, 3234, 9]; //set whatsapp version

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

    // this will be called on every chat update event
    conn.on("chat-update", async (chatUpdate) => {
      if (chatUpdate.messages && chatUpdate.count) {
        const message = chatUpdate.messages.all()[0];
        const fromMe = message?.key?.fromMe;
        const mmid = message?.key?.remoteJid;
        if (!mmid || fromMe || fnc.isStory(mmid)) return;
        await conn.chatRead(mmid).catch((err) => console.log(err));
        if (!isGroupID(mmid)) {
          const res = await fnc.personalMsg(mmid.split("@")[0]);
          if (!res) return;
          const text =
            "Hello, Thanks for your message 😊 However, i only respond to messages in a group.\n\nOur Official Group: *https://chat.whatsapp.com/CRcn6RFc0RKFvR4aNKjYK6*";
          const sentMsg = await conn.sendMessage(mmid, text, MessageType.text);
          return;
        }
        /*
        if (fnc.store[mmid] === null || fnc.store[mmid] === undefined) {
          fnc.store[mmid] = {};
          fnc.store[mmid].chat = [];
        }
        
        if (fnc.store[mmid].chat.length >= 10) {
          const groupMetaData = await conn.groupMetadata(mmid);
          const from = message.participant;
          if (fnc.store[mmid].chat.every((f) => f.participant === from)) {
            const duration =
              fnc.store[mmid].chat[0].messageTimestamp -
              fnc.store[mmid].chat[9].messageTimestamp;
            if (duration <= 15) {
              const isAdm = await fnc.isAdmin(
                groupMetaData.participants,
                message.participant
              );
              if (isAdm[0]) {
                await conn.groupSettingChange(
                  mmid,
                  GroupSettingChange.messageSend,
                  true
                );
                fnc.store[mmid].defaulter = from;
                fnc.store[mmid].admin = isAdm[0];
                fnc.store[mmid].chat = [];
              }
            }
          }
          if (fnc.store[mmid].chat.length) fnc.store[mmid].chat.shift();
        }
        fnc.store[mmid].chat.push(message);
        */
        //fnc.detailLog(message);
        let extended;
        if (message?.message?.ephemeralMessage)
          extended =
            message?.message?.ephemeralMessage?.message?.extendedTextMessage;
        else extended = message?.message?.extendedTextMessage;
        if (extended === null || extended === undefined) return;
        if (extended?.contextInfo?.participant === fnc.self) {
          if (
            extended?.contextInfo?.quotedMessage?.extendedTextMessage &&
            extended?.contextInfo?.quotedMessage?.extendedTextMessage?.text.includes(
              "create a meme"
            )
          ) {
            const memeid =
              extended?.contextInfo?.quotedMessage?.extendedTextMessage?.contextInfo?.mentionedJid[0].split(
                "@"
              )[0];
            const result = await fnc.memes(memeid, extended.text);
            if (!result) return;
            //let finalMsg = `*Your meme is ready download* d\n\n${result}`;
            let finalMsg = { url: result };
            const extra = {
              quoted: message,
              thumbnail: null,
              mimetype: Mimetype.jpeg,
            };
            await conn.sendMessage(mmid, finalMsg, MessageType.image, extra);
          }
          return;
        }
        const jids = await fnc.adjustJid(extended?.contextInfo?.mentionedJid);
        if (!jids || jids[0] !== fnc.self) return;
        const fetchMsg = extended?.text.split(" ");
        if (fetchMsg[0] !== "@" + fnc.self.split("@")[0]) {
          const text =
            "Sorry i did not understand. Please check for extra space or issue a *help* command to get lists of commands i follow.";
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, text, MessageType.extendedText, extra);
          return;
        }
        const mc = fetchMsg[1]?.toLowerCase();
        if (mc === "ping") {
          //  console.log(mmid);
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            "```Pong``` 😎",
            MessageType.extendedText,
            extra
          );
        } else if (mc === "help") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const gname = groupMetaData?.subject?.trim();
          const gusers = groupMetaData?.participants?.length;
          const uname = "@" + message.participant?.split("@")[0];
          const dmsg = groupMetaData?.ephemeralDuration ? "ON" : "OFF";
          const replaceT = {
            gname: gname,
            gusers: gusers,
            uname: uname,
            dmsg: dmsg,
          };
          const text = fnc.botText.replace(
            /gname|gusers|uname|dmsg/gi,
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
        } else if (mc === "donation") {
          const text =
            "Thank you for showing interest 😊 If you like me and want to see me grow kindly contact my owner Maaz for donation queries.\n\nIf you use UPI you can also send payments to *memset@ibl* . Thank you.";
          const options = {
            quoted: message,
            contextInfo: {
              mentionedJid: [message.participant],
            },
          };
          let sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
          const vcard =
            "BEGIN:VCARD\n" + // metadata of the contact card
            "VERSION:3.0\n" +
            "FN:Maaz: Bot Owner\n" + // full name
            "TEL;type=CELL;type=VOICE;waid=918840081034:+918840081034\n" + // WhatsApp ID + phone number
            "END:VCARD";
          sentMsg = await conn.sendMessage(
            mmid,
            { displayname: "Maaz: Bot Owner", vcard: vcard },
            MessageType.contact
          );
        } else if (mc === "admins") {
          const command = fetchMsg.splice(0, 2);
          command.push(fetchMsg.join(" "));
          let token = command[2];
          if (!token || !token.trim().length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please specify some text to tag admins*\n\n_ex: admins hello_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const groupMetaData = await conn.groupMetadata(mmid);
          const admins = await fnc.getAdmins(groupMetaData.participants);
          let text = "";
          const mentioned = [];
          admins.forEach((adm) => {
            const contact = adm.split("@")[0];
            text += `@${contact}  `;
            mentioned.push(adm);
          });
          text = text.trim();
          const options = {
            quoted: message,
            contextInfo: {
              mentionedJid: [...mentioned],
            },
          };
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
        } else if (mc === "closegc") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const s1 = await conn.groupSettingChange(
            mmid,
            GroupSettingChange.messageSend,
            true
          );
        } else if (mc === "opengc") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const s1 = await conn.groupSettingChange(
            mmid,
            GroupSettingChange.messageSend,
            false
          );
        } else if (mc === "promote") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const parts = jids.splice(1, jids.length - 1);
          const admins = await fnc.getAdmins(groupMetaData.participants);
          const candidates = [];
          for (let v of parts) {
            if (!admins.includes(v)) candidates.push(v);
          }
          if (!candidates.length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please mention members to be added as admins.*\n\n_ex: promote @member1 @member2_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          await conn.groupMakeAdmin(mmid, candidates);
          const text = `Congratulations 🎉 valid people have been added as admins and invalid people skipped.`;
          const options = {
            quoted: message,
          };
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
        } else if (mc === "demote") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const parts = jids.splice(1, jids.length - 1);
          const admins = await fnc.getAdmins(groupMetaData.participants);
          const candidates = [];
          for (let v of parts) {
            if (admins.includes(v)) candidates.push(v);
          }
          if (!candidates.length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please mention members to be removed as admins.*\n\n_ex: demote @member1 @member2_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const removed = await conn.groupDemoteAdmin(mmid, candidates);
          const text = `Valid people have been removed as admins and invalid people skipped.`;
          const options = {
            quoted: message,
          };
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
        } else if (mc === "setname") {
          const groupMetaData = await conn.groupMetadata(mmid);
          if (groupMetaData.restrict === true) {
            const isAdm = await fnc.isAdmin(
              groupMetaData.participants,
              message.participant
            );
            if (!isAdm[1]) {
              const text = "*❌ Only group admins can issue this command.*";
              const options = {
                quoted: message,
              };
              const sentMsg = await conn.sendMessage(
                mmid,
                text,
                MessageType.extendedText,
                options
              );
              return;
            }
            if (!isAdm[0]) {
              const text =
                "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
              const options = {
                quoted: message,
              };
              const sentMsg = await conn.sendMessage(
                mmid,
                text,
                MessageType.extendedText,
                options
              );
              return;
            }
          }
          const cmd = fetchMsg.splice(0, 2);
          cmd.push(fetchMsg.join(" "));
          const gname = cmd[2];
          if (!gname || !gname.trim().length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please provide valid group name.*\n\n_ex: setname My Group_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          await conn.groupUpdateSubject(mmid, gname);
        } else if (mc === "setdesc") {
          const groupMetaData = await conn.groupMetadata(mmid);
          if (groupMetaData.restrict === true) {
            const isAdm = await fnc.isAdmin(
              groupMetaData.participants,
              message.participant
            );
            if (!isAdm[1]) {
              const text = "*❌ Only group admins can issue this command.*";
              const options = {
                quoted: message,
              };
              const sentMsg = await conn.sendMessage(
                mmid,
                text,
                MessageType.extendedText,
                options
              );
              return;
            }
            if (!isAdm[0]) {
              const text =
                "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
              const options = {
                quoted: message,
              };
              const sentMsg = await conn.sendMessage(
                mmid,
                text,
                MessageType.extendedText,
                options
              );
              return;
            }
          }
          const cmd = fetchMsg.splice(0, 2);
          cmd.push(fetchMsg.join(" "));
          const gdesc = cmd[2];
          if (!gdesc || !gdesc.trim().length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please provide valid group description text.*\n\n_ex: setdesc My Awesome Group_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          await conn.groupUpdateDescription(mmid, gdesc);
        } else if (mc === "kick") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const parts = jids.splice(1, jids.length - 1);
          const superAdm = await fnc.getSuperAdmin(groupMetaData.participants);
          const members = await fnc.allMembers(groupMetaData.participants);
          const candidates = [];
          for (let v of parts) {
            if (members.includes(v) && v !== superAdm) candidates.push(v);
          }
          if (!candidates.length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please mention members to be removed from group.*\n\n_ex: kick @member1 @member2_\n\n*Note i dont remove myself or super-owner of the group*";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          for (let i of candidates) {
            await conn.groupRemove(mmid, [i]);
          }
        } else if (mc === "linkgc") {
          const code = await conn.groupInviteCode(mmid);
          const invite = "https://chat.whatsapp.com/" + code;
          const text = await conn.generateLinkPreview(invite);
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText
          );
        } else if (mc === "notify") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const command = fetchMsg.splice(0, 2);
          command.push(fetchMsg.join(" "));
          let token = command[2];
          if (!token || !token.trim().length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please specify some text to tag members*\n\n_ex: notify hello_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let text = "";
          const mentioned = [];
          groupMetaData.participants.forEach((mem) => {
            if (mem.jid === fnc.self) return;
            const contact = mem.jid.split("@")[0];
            text += `@${contact}  `;
            mentioned.push(mem.jid);
          });
          text = text.trim();
          const options = {
            quoted: message,
            contextInfo: {
              mentionedJid: [...mentioned],
            },
          };
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
        } else if (mc === "joke") {
          let token = fetchMsg[2];
          const arr = ["random", "programming"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please specify the type of joke.*\n\n_ex: joke random_\n_joke programming_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let result;
          token = token.toLowerCase();
          if (token === "random") {
            result = await fnc.jokes("random");
          } else if (token === "programming") {
            result = await fnc.jokes("programming");
          } else return;
          if (!result) return;
          let finalMsg = `${result}\n😛😛`;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
        } else if (mc === "roast") {
          const result = await fnc.insult();
          if (!result) return;
          let finalMsg = `${result}\n😛😛`;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
        } else if (mc === "sticker") {
          if (!extended?.contextInfo?.quotedMessage) {
            await conn.sendMessage(
              mmid,
              "Please provide a valid image/video",
              MessageType.extendedText,
              { quoted: message }
            );
            return;
          }
          const downloadMedia = new proto.WebMessageInfo();
          downloadMedia["message"] = extended.contextInfo.quotedMessage;
          const messageT = Object.keys(downloadMedia.message)[0];
          let stretch = "full",
            quality = 100;
          if (isNaN(fetchMsg[2])) {
            stretch = fetchMsg[2];
            if (fetchMsg[3]) quality = parseInt(fetchMsg[3]);
          } else {
            stretch = undefined;
            quality = parseInt(fetchMsg[2]);
          }
          if (isNaN(quality) || quality > 100 || quality < 1) quality = 50;
          let buffer;
          if (messageT === "imageMessage" || messageT === "videoMessage")
            buffer = await conn.downloadMediaMessage(downloadMedia);
          // to decrypt & use as a buffer
          else
            buffer = await fnc.textSticker(
              downloadMedia?.message?.conversation ||
                downloadMedia?.message?.extendedTextMessage?.text ||
                "Error converting"
            );
          const sticker = await fnc.makeSticker(
            buffer,
            stretch,
            quality,
            messageT
          );
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, sticker, MessageType.sticker, extra);
          // return;
          // await conn.sendMessage(
          //   mmid,
          //   "Please provide a valid image/video",
          //   MessageType.extendedText,
          //   { quoted: message }
          // );
        } else if (mc === "advice") {
          const advice = await fnc.advice();
          if (!advice) return;
          let finalMsg = { url: advice.image };
          const extra = {
            quoted: message,
            caption: `${advice.advice}\n😊😊`,
            mimetype: Mimetype.png,
          };
          await conn.sendMessage(mmid, finalMsg, MessageType.image, extra);
        } else if (mc === "dismantle") {
          if (message.participant !== fnc.owner) {
            let finalMsg = "Only Maaz can issue this command.";
            const extra = {
              quoted: message,
            };
            await conn.sendMessage(
              mmid,
              finalMsg,
              MessageType.extendedText,
              extra
            );
            return;
          }
          const token = fetchMsg[2];
          const groupMetaData = await conn.groupMetadata(mmid);
          const activeMetaData = await conn.groupMetadata(fnc.attd);
          const admins = await fnc.getAdmins(groupMetaData.participants);
          const allMembers = await fnc.allMembers(groupMetaData.participants);
          let activeMembers = [],
            finalMsg;
          if (token !== "all") {
            activeMembers = await fnc.allMembers(activeMetaData.participants);
            finalMsg = "```Dismantle completed``` 👋";
          } else {
            activeMembers.push(fnc.self);
            finalMsg = "*Group dismantled*";
          }
          activeMembers.push(...admins);
          const difference = allMembers.filter(
            (e) => !activeMembers.includes(e)
          );
          for (let i of difference) {
            await conn.groupRemove(mmid, [i]);
          }
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
        } else if (mc === "memes") {
          let token = fetchMsg[2];
          if (!token || !token.trim().length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please specify the type of action.*\n\n_ex: memes list: list meme templates_\n\n_memes make two buttons: make a meme from one of templates_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let meme = {};
          token = token.toLowerCase();
          if (token === "list") {
            const finalMsg = `Below is the default meme template.\n\nhttps://imgflip.com/memetemplates \n\nUse as below command\n\n*memes make two buttons*`;
            const extra = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              finalMsg,
              MessageType.extendedText,
              extra
            );
          } else if (token === "make") {
            const result = fetchMsg.splice(0, 3);
            result.push(fetchMsg.join(" "));
            let token1 = result[3];
            if (!token1) return;
            let exist = false;
            for (let m of fnc.memeJson.memes) {
              if (m.name.toLowerCase() === token1.trim().toLowerCase()) {
                exist = true;
                meme.boxes = m.box_count;
                meme.id = m.id;
              }
            }
            if (!exist) {
              const finalMsg =
                "Sorry we yet dont support this meme 😔\n\nCheck meme spelling or try a different one.";
              const extra = {
                quoted: message,
              };
              const sentMsg = await conn.sendMessage(
                mmid,
                finalMsg,
                MessageType.extendedText,
                extra
              );
            } else {
              const finalMsg = `We can create a meme out of it 😊\n\nIt has got ${meme.boxes} boxes. Provide text for each box in a new line by replying to this message`;
              const extra = {
                quoted: message,
                contextInfo: { mentionedJid: [meme.id + "@s.whatsapp.net"] },
              };
              const sentMsg = await conn.sendMessage(
                mmid,
                finalMsg,
                MessageType.extendedText,
                extra
              );
            }
          }
        } else if (mc === "codeforces") {
          let token = fetchMsg[2];
          let arr = ["upcoming", "ongoing"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the type of action.*\n\n_ex: ${mc} upcoming: gets upcoming contests in 15days_\n\n_${mc} ongoing: gets ongoing contests in 15days_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let result;
          const type = fetchMsg[2].toLowerCase();
          if (type === "ongoing") result = await fnc.clist(1, 1);
          else if (type === "upcoming") result = await fnc.clist(0, 1);
          if (!result) return;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, result, MessageType.extendedText, extra);
        } else if (mc === "codechef") {
          let token = fetchMsg[2];
          let arr = ["upcoming", "ongoing"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the type of action.*\n\n_ex: ${mc} upcoming: gets upcoming contests in 15days_\n\n_${mc} ongoing: gets ongoing contests in 15days_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let result;
          const type = fetchMsg[2].toLowerCase();
          if (type === "ongoing") result = await fnc.clist(1, 2);
          else if (type === "upcoming") result = await fnc.clist(0, 2);
          if (!result) return;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, result, MessageType.extendedText, extra);
        } else if (mc === "leetcode") {
          let token = fetchMsg[2];
          let arr = ["upcoming", "ongoing"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the type of action.*\n\n_ex: ${mc} upcoming: gets upcoming contests in 15days_\n\n_${mc} ongoing: gets ongoing contests in 15days_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let result;
          const type = fetchMsg[2].toLowerCase();
          if (type === "ongoing") result = await fnc.clist(1, 102);
          else if (type === "upcoming") result = await fnc.clist(0, 102);
          if (!result) return;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, result, MessageType.extendedText, extra);
        } else if (mc === "bsio") {
          let token = fetchMsg[2];
          let arr = ["upcoming", "ongoing"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the type of action.*\n\n_ex: ${mc} upcoming: gets upcoming contests in 15days_\n\n_${mc} ongoing: gets ongoing contests in 15days_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let result;
          const type = fetchMsg[2].toLowerCase();
          if (type === "ongoing") result = await fnc.clist(1, 117);
          else if (type === "upcoming") result = await fnc.clist(0, 117);
          if (!result) return;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, result, MessageType.extendedText, extra);
        } else if (mc === "hackerearth") {
          let token = fetchMsg[2];
          let arr = ["upcoming", "ongoing"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the type of action.*\n\n_ex: ${mc} upcoming: gets upcoming contests in 15days_\n\n_${mc} ongoing: gets ongoing contests in 15days_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let result;
          const type = fetchMsg[2].toLowerCase();
          if (type === "ongoing") result = await fnc.clist(1, 73);
          else if (type === "upcoming") result = await fnc.clist(0, 73);
          if (!result) return;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, result, MessageType.extendedText, extra);
        } else if (mc === "contest") {
          const text =
            "*I listen to codeforces | codechef | leetcode | bsio | hackerearth*\n\n_ex: leetcode upcoming_";
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(mmid, text, MessageType.extendedText, extra);
        } else if (mc === "find") {
          const result = fetchMsg.splice(0, 2);
          result.push(fetchMsg.join(" "));
          let token = result[2];
          if (!token) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the video title,keyword to search.*\n\n_ex: find avengers endgame_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const yt = await fnc.searchYt(token);
          if (!yt || !yt.length) return;
          let finalMsg,
            text = "";
          yt.forEach((e, i) => {
            text += `*Video ${i + 1}*\n_${e.description}_\n${e.url}\n\n`;
          });
          finalMsg = text;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
        } else if (mc === "ttsm") {
          const options = {
            quoted: message,
          };
          const text = `*This feature has been suspended untill further notice as it triggered an abuse in usage*`;
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
          return;
          /*
          const result = fetchMsg.splice(0, 2);
          result.push(fetchMsg.join(" "));
          let token = result[2];
          if (!token) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the text for tts conversion.*\n\n_ex: tts hello world_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const tx = await fnc.tts(token, "MALE");
          if (!tx || !tx.length) return;
          const extra = {
            quoted: message,
            mimetype: Mimetype.ogg,
          };
          const readFile = util.promisify(fs.readFile);
          const audioFile = await readFile(tx);
          await conn.sendMessage(
            mmid,
            audioFile, // load a audio and send it
            MessageType.audio,
            extra
          );
          const delFile = util.promisify(fs.unlink);
          await delFile(tx);
          */
        } else if (mc === "ttsf") {
          const options = {
            quoted: message,
          };
          const text = `*This feature has been suspended untill further notice as it triggered an abuse in usage*`;
          const sentMsg = await conn.sendMessage(
            mmid,
            text,
            MessageType.extendedText,
            options
          );
          return;
          /*
          const result = fetchMsg.splice(0, 2);
          result.push(fetchMsg.join(" "));
          let token = result[2];
          if (!token) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the text for tts conversion.*\n\n_ex: tts hello world_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const tx = await fnc.tts(token, "FEMALE");
          if (!tx || !tx.length) return;
          const extra = {
            quoted: message,
            mimetype: Mimetype.ogg,
          };
          const readFile = util.promisify(fs.readFile);
          const audioFile = await readFile(tx);
          await conn.sendMessage(
            mmid,
            audioFile, // load a audio and send it
            MessageType.audio,
            extra
          );
          const delFile = util.promisify(fs.unlink);
          await delFile(tx);
          */
        } else if (mc === "search") {
          const result = fetchMsg.splice(0, 2);
          result.push(fetchMsg.join(" "));
          let token = result[2];
          if (!token) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the query to do a web search.*\n\n_ex: search narendra modi_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const bs = await fnc.search(token);
          if (!bs || !bs.length) return;
          let finalMsg,
            text = "";
          bs.forEach((e, i) => {
            text += `*Web Search ${i + 1}*\n_${e.snippet}_\n${e.url}\n\n`;
          });
          finalMsg = text;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
        } else if (mc === "images") {
          const result = fetchMsg.splice(0, 2);
          result.push(fetchMsg.join(" "));
          let token = result[2];
          if (!token) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the query to do a image search.*\n\n_ex: search cute puppies_`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const bs = await fnc.image(token);
          if (!bs || !bs.length) return;
          let finalMsg,
            text = "";
          bs.forEach((e, i) => {
            text += `*Image Link ${i + 1}*\n_${e.name}_\n${e.contentUrl}\n\n`;
          });
          finalMsg = text;
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
        } else if (mc === "toggle") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          let toggle = groupMetaData.ephemeralDuration;
          if (toggle === undefined) {
            await conn.toggleDisappearingMessages(mmid, WA_DEFAULT_EPHEMERAL);
            groupMetaData.ephemeralDuration = WA_DEFAULT_EPHEMERAL;
          } else {
            await conn.toggleDisappearingMessages(mmid, 0);
            delete groupMetaData.ephemeralDuration;
          }
        } else if (mc === "warn") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const isAdm = await fnc.isAdmin(
            groupMetaData.participants,
            message.participant
          );
          if (!isAdm[1]) {
            const text = "*❌ Only group admins can issue this command.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          if (!isAdm[0]) {
            const text =
              "*❌ I dont have admin privileges to perform this action. Add me as an admin and retry.*";
            const options = {
              quoted: message,
            };
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const parts = jids.splice(1, jids.length - 1);
          const superAdm = await fnc.getSuperAdmin(groupMetaData.participants);
          const members = await fnc.allMembers(groupMetaData.participants);
          const candidates = [];
          for (let v of parts) {
            if (members.includes(v) && v !== superAdm) candidates.push(v);
          }
          if (!candidates.length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please mention member name to issue a warning.*\n\n_ex: warn @member1 reason_\n\n*Note i dont warn myself or super-owner of the group*";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const result = fetchMsg.splice(0, 3);
          result.push(fetchMsg.join(" "));
          let token = result[3];
          if (!token) {
            const options = {
              quoted: message,
            };
            const text = `*Please specify the warning reason*`;
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          const name = candidates[0].split("@")[0];
          const fireName = name + mmid.split("@")[0];
          const res = await fnc.warningUpdate(fireName);
          if (!res.warn) return;
          const extra = {
            caption: `Hello @${name} you have been warned for *${token}*. Your total warn count is *${res.warn}*.Three warnings result in getting blocked.`,
            thumbnail: null,
            mimetype: Mimetype.png,
            contextInfo: {
              mentionedJid: [...candidates],
            },
          };
          const readFile = util.promisify(fs.readFile);
          const imageFile = await readFile("yc.png");
          await conn.sendMessage(mmid, imageFile, MessageType.image, extra);
          if (res.warn >= 3) await conn.groupRemove(mmid, [candidates[0]]);
        } else {
          if (jids[0] === fnc.self) {
            const text =
              "Sorry i did not understand. Please check for extra space or issue a *help* command to get lists of commands i follow.";
            const extra = {
              quoted: message,
            };
            await conn.sendMessage(mmid, text, MessageType.extendedText, extra);
          }
        }
      } //end message process
    });

    //called when some group join/remove action occurs
    conn.on("group-participants-update", async (group) => {
      if (group.action === "add") {
        //if (group.jid === fnc.attd) return;
        const groupMetaData = await conn.groupMetadata(group.jid);
        const gname = groupMetaData.subject.trim();
        const gusers = groupMetaData.participants.length;
        /*if (gusers < 6 && group.jid.split("-")[0] !== "918840081034") {
          const text =
            "Sorry! I only stay in a group with atleast 5 members 👋";
          // const text = "I am under construction. Will be updated once active 👋";
          const sentMsg = await conn.sendMessage(
            group.jid,
            text,
            MessageType.text
          );
          //  await conn.modifyChat(group.jid, ChatModification.delete);
          await conn.groupLeave(group.jid);
          return;
        }
        */
        const name = group.participants[0].split("@")[0];

        const uname = name === fnc.self.split("@")[0] ? "Everyone" : "@" + name;
        const dmsg = groupMetaData.ephemeralDuration ? "ON" : "OFF";
        const replaceT = {
          gname: gname,
          gusers: gusers,
          uname: uname,
          dmsg: dmsg,
        };
        const text = fnc.botJoinMsg.replace(
          /gname|gusers|uname|dmsg/gi,
          (matched) => replaceT[matched]
        );
        const options = {
          quoted: fnc.welcomeJson,
          contextInfo: {
            participant: "0@s.whatsapp.net",
            mentionedJid: [group.participants[0]],
          },
        };
        const sentMsg = await conn.sendMessage(
          group.jid,
          text,
          MessageType.extendedText,
          options
        );
      } else if (group.action === "remove") {
        const name = group.participants[0].split("@")[0];
        const res = await fnc.warningDelete(name);
        if (group.jid === fnc.cse) {
          const activeMetaData = await conn.groupMetadata(fnc.attd);
          let members = await fnc.allMembers(activeMetaData.participants);
          members = members.filter((e) => e !== fnc.self && e !== fnc.owner);
          if (members.length === 0) return;
          const add = members[0];
          const response = await conn.groupAdd(fnc.cse, [add]);
          await conn.groupRemove(fnc.attd, [add]);
          const sentMsg = await conn.sendMessage(
            fnc.attd,
            "```A member has been added to cse``` 🎉",
            MessageType.text
          );
        }
      } else return;
    });
    /*conn.on("group-update", async (update) => {
      if (update.announce == "false") {
      //  delete fnc.store[update.jid].defaulter;
      //  delete fnc.store[update.jid].admin;
        return;
      }
      if (
        update.announce == "true" &&
        fnc.store[update.jid].defaulter &&
        fnc.store[update.jid].admin
      ) {
        const name = fnc.store[update.jid].defaulter.split("@")[0];
        const res = await fnc.warningUpdate(name);
        if (!res.warn) return;
        const extra = {
          caption: `Hello @${name} you have been warned for *flooding*. Your total warn count is *${res.warn}*.Three warnings result in getting blocked.`,
          mimetype: Mimetype.png,
          contextInfo: {
            mentionedJid: [fnc.store[update.jid].defaulter],
          },
        };
        await conn.sendMessage(
          update.jid,
          fs.readFileSync("./assests/yc.png"),
          MessageType.image,
          extra
        );
        if (res.warn >= 3)
          await conn.groupRemove(update.jid, [fnc.store[update.jid].defaulter]);
        delete fnc.store[update.jid].defaulter;
        delete fnc.store[update.jid].admin;
      }
    });*/
  } catch (err) {
    console.log(err);
  }
}

async function robJobs(message) {
  const mmid = fnc.rj;
  await conn.sendMessage(mmid, message, MessageType.text);
}

export { connectAndRunBot, robJobs };
