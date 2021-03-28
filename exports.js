export const botText = `────✪ Created by M-A-A-Z ✪────

────────────────
Hello *uname*
────────────────

〘 *I'm Chotu Bot* 〙
‣ Start: @mentionMe in chat
   「 *@👽Chotu* 」
‣ Version: *3.0*
‣ Created: *25th March 2021*
‣ Group: *gname*
‣ Group users: *gusers Users*
‣ Official Group: *https://chat.whatsapp.com/BxiQo8aeYXVAvenCRa5tbd*
────────────────
┏━━━━━━━━━━━━━━━━━━━━
┃─────〘 Bot 〙────
┃━━━━━━━━━━━━━━━━━━━━
┠⊷️ Donation
┃ To Make any donation
┠⊷️ Help
┃ To show this message again
┗━━━━━━━━━━━━━━━━━━━━
┏━━━━━━━━━━━━━━━━━━━━
┃─────〘 GROUP 〙─────
┃━━━━━━━━━━━━━━━━━━━━
┠⊷️ Admins
┃ Send notification to admins
┃ 
┠⊷️ Closegc
┃ To close group
┃
┠⊷️ Opengc
┃ To open group
┃
┠⊷️ Promote
┃ To make someone an admin
┃
┠⊷️ Demote
┃ To remove someone as admin
┃
┠⊷️ Setname
┃ To change group's name
┃
┠⊷️ Setdesc
┃ To change group description
┃
┠⊷️ Kick
┃ To remove a member
┃
┠⊷️ Linkgc
┃ To get group invite link
┃
┠⊷️ Notify
┃ Send notification to members
┗━━━━━━━━━━━━━━━━━━━━
┏━━━━━━━━━━━━━━━━━━━━
┃─────〘 UTILS 〙─────
┃━━━━━━━━━━━━━━━━━━━━
┠⊷️ Find
┃ fetches specified video from youtube
┃   _ex: find avengers end game_
┃
┠⊷️ Joke
┃ cracks a joke as specified
┃   _ex: joke random_
┃   _ex: joke programming_
┃   _ex: joke insult_
┃
┠⊷️ Advice
┃ gives you a random life advice
┃
┠⊷️ Memes
┃ lists a meme template or make a meme
┃   _ex: memes list_
┃   _ex: memes make two buttons_
┃
┠⊷️ Contest
┃ displays upcoming or ongoing contest
┃   _ex: contest leetcode upcoming_
┃   _ex: contest leetcode ongoing_
┃
┃⊷️ Search
┃ does a web search for given query
┃   _ex: search narendra modi_
┗━━━━━━━━━━━━━━━━━━━━`;

export const welcomeJson = {
  key: {
    remoteJid: "0@s.whatsapp.net",
    fromMe: false,
    id: "F3AA1A0319601E852208CB0B276750BE",
  },
  message: {
    imageMessage: {
      url:
        "https://mmg.whatsapp.net/d/f/AnVJ40MKhlGyDSh-849zvMb8DNhdxisWXFukiIb6y39e.enc",
      mimetype: "image/jpeg",
      caption: "Welcome to our group ❤️",
      fileSha256: "viBHanPyhAZ5vF1whh3JxihjhH21pzoszdy9rDZdB9M=",
      fileLength: "2926",
      height: 170,
      width: 255,
      mediaKey: "nKXkGabBmuOpCreo757CJhHV30D09V6vPWQj6QGYgR0=",
      fileEncSha256: "cAJJgSFqXSjPenoP2S/wynoKcQvz93KTBEWI97qAftg=",
      directPath:
        "/v/t62.7118-24/35827800_1157462314683107_7974811054422973669_n.enc?oh=12df84906699029ddf6d336ba938dcc9&oe=60856A32",
      mediaKeyTimestamp: "1616762636",
      jpegThumbnail:
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIACoAPwMBIgACEQEDEQH/xAAtAAEBAQEBAAAAAAAAAAAAAAAAAwUEAgEBAQEBAAAAAAAAAAAAAAAAAAQBBf/aAAwDAQACEAMQAAAA7V3Nvgv5JK+iC40mSv5mtnS59d/fhXNZksYYlkAAA//EACcQAAAEBQIGAwAAAAAAAAAAAAABAgMRFBVSUwQSBRMgITAxQEJD/9oACAEBAAE/APBLu2iXdtEu7aDZcT7IEw4r0URLu2iXdtEu7b0al1aFOL2bjI4JIaLmb0qV23fXorR4hWjxCtHiDnESc78uBhriRNfnExWjxCtHiFaPF8H/xAAdEQACAgIDAQAAAAAAAAAAAAABAgATA1ISIFEx/9oACAECAQE/AOD6mVvqZW+pnB9TLE9i5UBjZUJ+yxPev//EABsRAAEFAQEAAAAAAAAAAAAAAAIAARITUVIg/9oACAEDAQE/AJh0ymHTKYdMph0ytDVYGqwNVob5/9k=",
    },
  },
  messageTimestamp: "1616691826",
  status: "ERROR",
  ephemeralOutOfSync: false,
};

export const self = "917457963544@s.whatsapp.net";

export function isStory(jid) {
  return jid === "status@broadcast";
}

export function getAdmins(gdata) {
  const admins = [];
  let si;
  gdata.forEach((a, i) => {
    if (a.jid === self) return;
    if (a.isAdmin) admins.push(a.jid);
    if (a.isSuperAdmin) si = i;
  });
  admins.unshift(admins.splice(si, 1)[0]);
  return admins;
}

export function isAdmin(gdata, ptc) {
  const admin = [false, false];
  for (let el of gdata) {
    if (el.jid === self) admin[0] = el.isAdmin;
    if (el.jid === ptc) admin[1] = el.isAdmin;
  }
  return admin;
}
