import pkg from "@adiwajshing/baileys";
import e from "express";
import fs from "fs";
import * as fnc from "./exports.js";

const {
  WAConnection,
  MessageType,
  MessageOptions,
  Mimetype,
  isGroupID,
  ReconnectMode,
  GroupSettingChange,
  WA_DEFAULT_EPHEMERAL,
} = pkg;

async function connectAndRunBot() {
  try {
    const conn = new WAConnection(); // create a baileys connection object

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
        // console.log(JSON.stringify(message, null, 5));
        const fromMe = message.key.fromMe;
        const mmid = message.key.remoteJid;
        if (!mmid || fromMe || fnc.isStory(mmid)) return;
        await conn.chatRead(mmid);
        if (!isGroupID(mmid)) {
          const text =
            "Hello, Thanks for your message 😊 However, i only respond to messages in a group.\n\nOur Official Group: *https://chat.whatsapp.com/BxiQo8aeYXVAvenCRa5tbd*";
          const sentMsg = await conn.sendMessage(mmid, text, MessageType.text);
          return;
        }
        let extended;
        if (message.message.ephemeralMessage)
          extended =
            message.message.ephemeralMessage.message.extendedTextMessage;
        else extended = message.message.extendedTextMessage;
        if (extended === null || extended === undefined) return;
        if (extended.contextInfo.participant === fnc.self) {
          if (
            extended.contextInfo.quotedMessage.extendedTextMessage &&
            extended.contextInfo.quotedMessage.extendedTextMessage.text.includes(
              "create a meme"
            )
          ) {
            const memeid = extended.contextInfo.quotedMessage.extendedTextMessage.contextInfo.mentionedJid[0].split(
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
        const jids = await fnc.adjustJid(extended.contextInfo.mentionedJid);
        if (jids[0] !== fnc.self) return;
        const fetchMsg = extended.text.split(" ");
        const mc = fetchMsg[1].toLowerCase();
        if (mc === "help") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const gname = groupMetaData.subject;
          const gusers = groupMetaData.participants.length;
          const uname = "@" + message.participant.split("@")[0];
          const dmsg = groupMetaData.ephemeralDuration ? "ON" : "OFF";
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
            "Thank you for showing interest 😊 If you like me and want to see me grow kindly contact my owner Maaz for donation queries.\n\nIf you use UPI you can also send payments to *memset@icici* . Thank you.";
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
              mentionedJid: mentioned,
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
          const isAdm = fnc.isAdmin(
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
          const isAdm = fnc.isAdmin(
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
          const isAdm = fnc.isAdmin(
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
          const text = `Congratulations 🎉 valid candidates have been added as admins.`;
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
          const isAdm = fnc.isAdmin(
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
          const text = `Valid candidates have been removed as admins.`;
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
            const isAdm = fnc.isAdmin(
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
            const isAdm = fnc.isAdmin(
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
          const isAdm = fnc.isAdmin(
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
          const members = await fnc.allMembers(groupMetaData.participants);
          const candidates = [];
          for (let v of parts) {
            if (members.includes(v)) candidates.push(v);
          }
          if (!candidates.length) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please mention members to be removed from group.*\n\n_ex: kick @member1 @member2_";
            const sentMsg = await conn.sendMessage(
              mmid,
              text,
              MessageType.extendedText,
              options
            );
            return;
          }
          candidates.forEach(async (e) => await conn.groupRemove(mmid, e));
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
          const groupMetaData = await conn.groupMetadata(mmid);
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
              mentionedJid: mentioned,
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
          const arr = ["random", "programming", "insult"];
          if (
            !token ||
            !token.trim().length ||
            !arr.includes(token.toLowerCase())
          ) {
            const options = {
              quoted: message,
            };
            const text =
              "*Please specify the type of joke.*\n\n_ex: joke random_\n_joke programming_\n_joke insult_";
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
          } else if (token === "insult") {
            result = await fnc.insult();
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
            text += `*Link ${i + 1}*\n${e.url}\n\n`;
          });
          finalMsg = await conn.generateLinkPreview(text);
          const extra = {
            quoted: message,
          };
          await conn.sendMessage(
            mmid,
            finalMsg,
            MessageType.extendedText,
            extra
          );
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
            text += `*Link ${i + 1}*\n${e.url}\n\n`;
          });
          finalMsg = await conn.generateLinkPreview(text);
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
          const isAdm = fnc.isAdmin(
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
      if (group.action !== "add") return;
      const groupMetaData = await conn.groupMetadata(group.jid);
      const gname = groupMetaData.subject;
      const gusers = groupMetaData.participants.length;
      if (gusers < 6 && gname !== "Testing Bot321") {
        const text = "Sorry! I only stay in a group with atleast 5 members 👋";
        // const text = "I am under construction. Will be updated once active 👋";
        const sentMsg = await conn.sendMessage(
          group.jid,
          text,
          MessageType.text
        );
        await conn.groupLeave(group.jid);
        return;
      }
      const name = group.participants[0].split("@")[0];
      const uname = name === fnc.self.split("@")[0] ? "Everyone" : "@" + name;
      const dmsg = groupMetaData.ephemeralDuration ? "ON" : "OFF";
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
    });
  } catch (err) {
    console.log(err);
  }
}

export default connectAndRunBot;
