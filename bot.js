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
        //console.log(JSON.stringify(message, null, 5));
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
        if (
          message.message.extendedTextMessage === null ||
          message.message.extendedTextMessage === undefined
        )
          return;
        if (
          message.message.extendedTextMessage.contextInfo.mentionedJid[0] &&
          message.message.extendedTextMessage.contextInfo.mentionedJid[0] !==
            fnc.self
        )
          return;
        const fetchMsg = message.message.extendedTextMessage.text.split(" ");
        const mc = fetchMsg[1].toLowerCase();
        if (mc === "help") {
          const groupMetaData = await conn.groupMetadata(mmid);
          const gname = groupMetaData.subject;
          const gusers = groupMetaData.participants.length;
          const uname = "@" + message.participant.split("@")[0];
          const replaceT = {
            gname: gname,
            gusers: gusers,
            uname: uname,
          };
          const text = fnc.botText.replace(
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
          const admins = fnc.getAdmins(groupMetaData.participants);
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

          const s2 = await conn.groupSettingChange(
            mmid,
            GroupSettingChange.settingsChange,
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

          const s2 = await conn.groupSettingChange(
            mmid,
            GroupSettingChange.settingsChange,
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
          const candidates = message.message.extendedTextMessage.contextInfo.mentionedJid.splice(
            1,
            message.message.extendedTextMessage.contextInfo.mentionedJid
              .length - 1
          );
          if (!candidates) {
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
          const candidates = message.message.extendedTextMessage.contextInfo.mentionedJid.splice(
            1,
            message.message.extendedTextMessage.contextInfo.mentionedJid
              .length - 1
          );
          if (!candidates) {
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
          await conn.groupDemoteAdmin(mmid, candidates);
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
              "*Please provide some group description text.*\n\n_ex: setdesc My Awesome Group_";
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
          const candidates = message.message.extendedTextMessage.contextInfo.mentionedJid.splice(
            1,
            message.message.extendedTextMessage.contextInfo.mentionedJid
              .length - 1
          );
          if (!candidates) {
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
          await conn.groupRemove(mmid, candidates);
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
        }
      } //end message process
    });

    //called when some group join/remove action occurs
    conn.on("group-participants-update", async (group) => {
      if (group.action !== "add") return;
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
      const uname = name === fnc.self.split("@")[0] ? "Everyone" : "@" + name;
      const replaceT = {
        gname: gname,
        gusers: gusers,
        uname: uname,
      };
      const text = fnc.botText.replace(
        /gname|gusers|uname/gi,
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
