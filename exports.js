import axios from "axios";
import lxn from "luxon";
import yts from "yt-search";
import fs from "fs";
import util from "util";
import textToSpeech from "@google-cloud/text-to-speech";

const { DateTime } = lxn;

//export const store = [];

export const botJoinMsg = `────✪ Created by M-A-A-Z ✪────
────────────────
Hello *uname*
────────────────
〘 *I'm Chotu Bot* 〙
‣ Start: @mentionMe in chat
   「 *@Chotu* 」
‣ Group: *gname*
‣ Group users: *gusers Users*
‣ Official Group: *https://chat.whatsapp.com/C1qr5GHOMorJDIihllwA4V*
‣ Issue a *help* command to get started`;

export const botText = `────✪ Created by M-A-A-Z ✪────

────────────────
Hello *uname*
────────────────

〘 *I'm Chotu Bot* 〙
‣ Start: @mentionMe in chat
   「 *@Chotu* 」
‣ Disappearing Message: *dmsg*
‣ Version: *3.0*
‣ Created: *25th March 2021*
‣ Group: *gname*
‣ Group users: *gusers Users*
‣ Official Group: *https://chat.whatsapp.com/C1qr5GHOMorJDIihllwA4V*
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
┠⊷️ Warn
┃ To issue a warning to user
┃
┠⊷️ Toggle
┃ Toggle disappearing message
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
┃
┠⊷️ Advice
┃ gives you a random life advice
┃
┠⊷️ Roast
┃ a short evil roast
┃
┠⊷️ Memes
┃ lists a meme template or make meme
┃   _ex: memes list_
┃   _ex: memes make two buttons_
┃
┠⊷️ Contest
┃ displays upcoming or ongoing contest
┃   _ex: leetcode upcoming_
┃   _ex: leetcode ongoing_
┃   watches:
┃   codeforces,codechef,leetcode
┃   bsio,hackerearth
┃
┃⊷️ Search
┃ does a web search for given query
┃   _ex: search narendra modi_
┃
┃⊷️ Images
┃ does a image search
┃   _ex: images cute puppies_
┃
┃⊷️ TTS
┃ converts text to speech
┃ Male _ex: ttsm hello world_
┃ Female _ex: ttsf hello world_
┗━━━━━━━━━━━━━━━━━━━━`;

export const welcomeJson = {
  key: {
    remoteJid: "0@s.whatsapp.net",
    fromMe: false,
    id: "F3AA1A0319601E852208CB0B276750BE",
  },
  message: {
    imageMessage: {
      url: "https://mmg.whatsapp.net/d/f/AnVJ40MKhlGyDSh-849zvMb8DNhdxisWXFukiIb6y39e.enc",
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

export const memeJson = {
  memes: [
    {
      id: "181913649",
      name: "Drake Hotline Bling",
      url: "https://i.imgflip.com/30b1gx.jpg",
      width: 1200,
      height: 1200,
      box_count: 2,
    },
    {
      id: "112126428",
      name: "Distracted Boyfriend",
      url: "https://i.imgflip.com/1ur9b0.jpg",
      width: 1200,
      height: 800,
      box_count: 3,
    },
    {
      id: "87743020",
      name: "Two Buttons",
      url: "https://i.imgflip.com/1g8my4.jpg",
      width: 600,
      height: 908,
      box_count: 2,
    },
    {
      id: "247375501",
      name: "Buff Doge vs. Cheems",
      url: "https://i.imgflip.com/43a45p.png",
      width: 937,
      height: 720,
      box_count: 4,
    },
    {
      id: "131087935",
      name: "Running Away Balloon",
      url: "https://i.imgflip.com/261o3j.jpg",
      width: 761,
      height: 1024,
      box_count: 5,
    },
    {
      id: "129242436",
      name: "Change My Mind",
      url: "https://i.imgflip.com/24y43o.jpg",
      width: 482,
      height: 361,
      box_count: 2,
    },
    {
      id: "217743513",
      name: "UNO Draw 25 Cards",
      url: "https://i.imgflip.com/3lmzyx.jpg",
      width: 500,
      height: 494,
      box_count: 2,
    },
    {
      id: "124822590",
      name: "Left Exit 12 Off Ramp",
      url: "https://i.imgflip.com/22bdq6.jpg",
      width: 804,
      height: 767,
      box_count: 3,
    },
    {
      id: "222403160",
      name: "Bernie I Am Once Again Asking For Your Support",
      url: "https://i.imgflip.com/3oevdk.jpg",
      width: 750,
      height: 750,
      box_count: 2,
    },
    {
      id: "131940431",
      name: "Gru's Plan",
      url: "https://i.imgflip.com/26jxvz.jpg",
      width: 700,
      height: 449,
      box_count: 4,
    },
    {
      id: "102156234",
      name: "Mocking Spongebob",
      url: "https://i.imgflip.com/1otk96.jpg",
      width: 502,
      height: 353,
      box_count: 2,
    },
    {
      id: "438680",
      name: "Batman Slapping Robin",
      url: "https://i.imgflip.com/9ehk.jpg",
      width: 400,
      height: 387,
      box_count: 2,
    },
    {
      id: "188390779",
      name: "Woman Yelling At Cat",
      url: "https://i.imgflip.com/345v97.jpg",
      width: 680,
      height: 438,
      box_count: 2,
    },
    {
      id: "93895088",
      name: "Expanding Brain",
      url: "https://i.imgflip.com/1jwhww.jpg",
      width: 857,
      height: 1202,
      box_count: 4,
    },
    {
      id: "4087833",
      name: "Waiting Skeleton",
      url: "https://i.imgflip.com/2fm6x.jpg",
      width: 298,
      height: 403,
      box_count: 2,
    },
    {
      id: "178591752",
      name: "Tuxedo Winnie The Pooh",
      url: "https://i.imgflip.com/2ybua0.png",
      width: 800,
      height: 582,
      box_count: 2,
    },
    {
      id: "1035805",
      name: "Boardroom Meeting Suggestion",
      url: "https://i.imgflip.com/m78d.jpg",
      width: 500,
      height: 649,
      box_count: 4,
    },
    {
      id: "226297822",
      name: "Panik Kalm Panik",
      url: "https://i.imgflip.com/3qqcim.png",
      width: 640,
      height: 881,
      box_count: 3,
    },
    {
      id: "252600902",
      name: "Always Has Been",
      url: "https://i.imgflip.com/46e43q.png",
      width: 960,
      height: 540,
      box_count: 2,
    },
    {
      id: "135256802",
      name: "Epic Handshake",
      url: "https://i.imgflip.com/28j0te.jpg",
      width: 900,
      height: 645,
      box_count: 3,
    },
    {
      id: "97984",
      name: "Disaster Girl",
      url: "https://i.imgflip.com/23ls.jpg",
      width: 500,
      height: 375,
      box_count: 2,
    },
    {
      id: "148909805",
      name: "Monkey Puppet",
      url: "https://i.imgflip.com/2gnnjh.jpg",
      width: 923,
      height: 768,
      box_count: 2,
    },
    {
      id: "119139145",
      name: "Blank Nut Button",
      url: "https://i.imgflip.com/1yxkcp.jpg",
      width: 600,
      height: 446,
      box_count: 2,
    },
    {
      id: "80707627",
      name: "Sad Pablo Escobar",
      url: "https://i.imgflip.com/1c1uej.jpg",
      width: 720,
      height: 709,
      box_count: 3,
    },
    {
      id: "100777631",
      name: "Is This A Pigeon",
      url: "https://i.imgflip.com/1o00in.jpg",
      width: 1587,
      height: 1425,
      box_count: 3,
    },
    {
      id: "114585149",
      name: "Inhaling Seagull",
      url: "https://i.imgflip.com/1w7ygt.jpg",
      width: 1269,
      height: 2825,
      box_count: 4,
    },
    {
      id: "180190441",
      name: "They're The Same Picture",
      url: "https://i.imgflip.com/2za3u1.jpg",
      width: 1363,
      height: 1524,
      box_count: 3,
    },
    {
      id: "110163934",
      name: "I Bet He's Thinking About Other Women",
      url: "https://i.imgflip.com/1tl71a.jpg",
      width: 1654,
      height: 930,
      box_count: 2,
    },
    {
      id: "195515965",
      name: "Clown Applying Makeup",
      url: "https://i.imgflip.com/38el31.jpg",
      width: 750,
      height: 798,
      box_count: 4,
    },
    {
      id: "91538330",
      name: "X, X Everywhere",
      url: "https://i.imgflip.com/1ihzfe.jpg",
      width: 2118,
      height: 1440,
      box_count: 2,
    },
    {
      id: "27813981",
      name: "Hide the Pain Harold",
      url: "https://i.imgflip.com/gk5el.jpg",
      width: 480,
      height: 601,
      box_count: 2,
    },
    {
      id: "123999232",
      name: "The Scroll Of Truth",
      url: "https://i.imgflip.com/21tqf4.jpg",
      width: 1280,
      height: 1236,
      box_count: 2,
    },
    {
      id: "79132341",
      name: "Bike Fall",
      url: "https://i.imgflip.com/1b42wl.jpg",
      width: 500,
      height: 680,
      box_count: 3,
    },
    {
      id: "61579",
      name: "One Does Not Simply",
      url: "https://i.imgflip.com/1bij.jpg",
      width: 568,
      height: 335,
      box_count: 2,
    },
    {
      id: "155067746",
      name: "Surprised Pikachu",
      url: "https://i.imgflip.com/2kbn1e.jpg",
      width: 1893,
      height: 1893,
      box_count: 3,
    },
    {
      id: "216951317",
      name: "Guy Holding Cardboard Sign",
      url: "https://i.imgflip.com/3l60ph.jpg",
      width: 700,
      height: 702,
      box_count: 2,
    },
    {
      id: "89370399",
      name: "Roll Safe Think About It",
      url: "https://i.imgflip.com/1h7in3.jpg",
      width: 702,
      height: 395,
      box_count: 2,
    },
    {
      id: "101470",
      name: "Ancient Aliens",
      url: "https://i.imgflip.com/26am.jpg",
      width: 500,
      height: 437,
      box_count: 2,
    },
    {
      id: "134797956",
      name: "American Chopper Argument",
      url: "https://i.imgflip.com/2896ro.jpg",
      width: 640,
      height: 1800,
      box_count: 5,
    },
    {
      id: "55311130",
      name: "This Is Fine",
      url: "https://i.imgflip.com/wxica.jpg",
      width: 580,
      height: 282,
      box_count: 2,
    },
    {
      id: "21735",
      name: "The Rock Driving",
      url: "https://i.imgflip.com/grr.jpg",
      width: 568,
      height: 700,
      box_count: 2,
    },
    {
      id: "135678846",
      name: "Who Killed Hannibal",
      url: "https://i.imgflip.com/28s2gu.jpg",
      width: 1280,
      height: 1440,
      box_count: 3,
    },
    {
      id: "259237855",
      name: "Laughing Leo",
      url: "https://i.imgflip.com/4acd7j.png",
      width: 470,
      height: 470,
      box_count: 2,
    },
    {
      id: "124055727",
      name: "Y'all Got Any More Of That",
      url: "https://i.imgflip.com/21uy0f.jpg",
      width: 600,
      height: 471,
      box_count: 2,
    },
    {
      id: "3218037",
      name: "This Is Where I'd Put My Trophy If I Had One",
      url: "https://i.imgflip.com/1wz1x.jpg",
      width: 300,
      height: 418,
      box_count: 2,
    },
    {
      id: "28251713",
      name: "Oprah You Get A",
      url: "https://i.imgflip.com/gtj5t.jpg",
      width: 620,
      height: 465,
      box_count: 2,
    },
    {
      id: "175540452",
      name: "Unsettled Tom",
      url: "https://i.imgflip.com/2wifvo.jpg",
      width: 680,
      height: 550,
      box_count: 2,
    },
    {
      id: "6235864",
      name: "Finding Neverland",
      url: "https://i.imgflip.com/3pnmg.jpg",
      width: 423,
      height: 600,
      box_count: 3,
    },
    {
      id: "8072285",
      name: "Doge",
      url: "https://i.imgflip.com/4t0m5.jpg",
      width: 620,
      height: 620,
      box_count: 5,
    },
    {
      id: "196652226",
      name: "Spongebob Ight Imma Head Out",
      url: "https://i.imgflip.com/392xtu.jpg",
      width: 822,
      height: 960,
      box_count: 2,
    },
    {
      id: "61520",
      name: "Futurama Fry",
      url: "https://i.imgflip.com/1bgw.jpg",
      width: 552,
      height: 414,
      box_count: 2,
    },
    {
      id: "132769734",
      name: "Hard To Swallow Pills",
      url: "https://i.imgflip.com/271ps6.jpg",
      width: 680,
      height: 979,
      box_count: 2,
    },
    {
      id: "61556",
      name: "Grandma Finds The Internet",
      url: "https://i.imgflip.com/1bhw.jpg",
      width: 640,
      height: 480,
      box_count: 2,
    },
    {
      id: "84341851",
      name: "Evil Kermit",
      url: "https://i.imgflip.com/1e7ql7.jpg",
      width: 700,
      height: 325,
      box_count: 2,
    },
    {
      id: "91545132",
      name: "Trump Bill Signing",
      url: "https://i.imgflip.com/1ii4oc.jpg",
      width: 1866,
      height: 1529,
      box_count: 2,
    },
    {
      id: "101287",
      name: "Third World Success Kid",
      url: "https://i.imgflip.com/265j.jpg",
      width: 500,
      height: 500,
      box_count: 2,
    },
    {
      id: "101288",
      name: "Third World Skeptical Kid",
      url: "https://i.imgflip.com/265k.jpg",
      width: 426,
      height: 426,
      box_count: 2,
    },
    {
      id: "14371066",
      name: "Star Wars Yoda",
      url: "https://i.imgflip.com/8k0sa.jpg",
      width: 620,
      height: 714,
      box_count: 2,
    },
    {
      id: "5496396",
      name: "Leonardo Dicaprio Cheers",
      url: "https://i.imgflip.com/39t1o.jpg",
      width: 600,
      height: 400,
      box_count: 2,
    },
    {
      id: "17699",
      name: "Buddy Christ",
      url: "https://i.imgflip.com/dnn.jpg",
      width: 400,
      height: 400,
      box_count: 2,
    },
    {
      id: "161865971",
      name: "Marked Safe From",
      url: "https://i.imgflip.com/2odckz.jpg",
      width: 618,
      height: 499,
      box_count: 2,
    },
    {
      id: "99683372",
      name: "Sleeping Shaq",
      url: "https://i.imgflip.com/1nck6k.jpg",
      width: 640,
      height: 631,
      box_count: 2,
    },
    {
      id: "563423",
      name: "That Would Be Great",
      url: "https://i.imgflip.com/c2qn.jpg",
      width: 526,
      height: 440,
      box_count: 2,
    },
    {
      id: "61532",
      name: "The Most Interesting Man In The World",
      url: "https://i.imgflip.com/1bh8.jpg",
      width: 550,
      height: 690,
      box_count: 2,
    },
    {
      id: "4173692",
      name: "Scared Cat",
      url: "https://i.imgflip.com/2hgfw.jpg",
      width: 620,
      height: 464,
      box_count: 2,
    },
    {
      id: "61546",
      name: "Brace Yourselves X is Coming",
      url: "https://i.imgflip.com/1bhm.jpg",
      width: 622,
      height: 477,
      box_count: 2,
    },
    {
      id: "183518946",
      name: "Blank Transparent Square",
      url: "https://i.imgflip.com/319g4i.png",
      width: 1000,
      height: 1000,
      box_count: 2,
    },
    {
      id: "61544",
      name: "Success Kid",
      url: "https://i.imgflip.com/1bhk.jpg",
      width: 500,
      height: 500,
      box_count: 2,
    },
    {
      id: "29617627",
      name: "Look At Me",
      url: "https://i.imgflip.com/hmt3v.jpg",
      width: 300,
      height: 300,
      box_count: 2,
    },
    {
      id: "61585",
      name: "Bad Luck Brian",
      url: "https://i.imgflip.com/1bip.jpg",
      width: 475,
      height: 562,
      box_count: 2,
    },
    {
      id: "61533",
      name: "X All The Y",
      url: "https://i.imgflip.com/1bh9.jpg",
      width: 500,
      height: 355,
      box_count: 2,
    },
    {
      id: "285870",
      name: "Squidward",
      url: "https://i.imgflip.com/64ku.jpg",
      width: 500,
      height: 750,
      box_count: 2,
    },
    {
      id: "101716",
      name: "Yo Dawg Heard You",
      url: "https://i.imgflip.com/26hg.jpg",
      width: 500,
      height: 323,
      box_count: 2,
    },
    {
      id: "6531067",
      name: "See Nobody Cares",
      url: "https://i.imgflip.com/3vzej.jpg",
      width: 620,
      height: 676,
      box_count: 2,
    },
    {
      id: "8279814",
      name: "Cute Cat",
      url: "https://i.imgflip.com/4xgqu.jpg",
      width: 480,
      height: 532,
      box_count: 2,
    },
    {
      id: "163573",
      name: "Imagination Spongebob",
      url: "https://i.imgflip.com/3i7p.jpg",
      width: 500,
      height: 366,
      box_count: 2,
    },
    {
      id: "101910402",
      name: "Who Would Win?",
      url: "https://i.imgflip.com/1ooaki.jpg",
      width: 802,
      height: 500,
      box_count: 2,
    },
    {
      id: "460541",
      name: "Jack Sparrow Being Chased",
      url: "https://i.imgflip.com/9vct.jpg",
      width: 500,
      height: 375,
      box_count: 2,
    },
    {
      id: "61539",
      name: "First World Problems",
      url: "https://i.imgflip.com/1bhf.jpg",
      width: 552,
      height: 367,
      box_count: 2,
    },
    {
      id: "405658",
      name: "Grumpy Cat",
      url: "https://i.imgflip.com/8p0a.jpg",
      width: 500,
      height: 617,
      box_count: 2,
    },
    {
      id: "61581",
      name: "Put It Somewhere Else Patrick",
      url: "https://i.imgflip.com/1bil.jpg",
      width: 343,
      height: 604,
      box_count: 2,
    },
    {
      id: "1367068",
      name: "I Should Buy A Boat Cat",
      url: "https://i.imgflip.com/tau4.jpg",
      width: 500,
      height: 368,
      box_count: 2,
    },
    {
      id: "61580",
      name: "Too Damn High",
      url: "https://i.imgflip.com/1bik.jpg",
      width: 420,
      height: 316,
      box_count: 2,
    },
    {
      id: "61527",
      name: "Y U No",
      url: "https://i.imgflip.com/1bh3.jpg",
      width: 500,
      height: 500,
      box_count: 2,
    },
    {
      id: "28034788",
      name: "Marvel Civil War 1",
      url: "https://i.imgflip.com/govs4.jpg",
      width: 423,
      height: 734,
      box_count: 2,
    },
    {
      id: "61582",
      name: "Creepy Condescending Wonka",
      url: "https://i.imgflip.com/1bim.jpg",
      width: 550,
      height: 545,
      box_count: 2,
    },
    {
      id: "101511",
      name: "Don't You Squidward",
      url: "https://i.imgflip.com/26br.jpg",
      width: 500,
      height: 333,
      box_count: 2,
    },
    {
      id: "29562797",
      name: "I'm The Captain Now",
      url: "https://i.imgflip.com/hlmst.jpg",
      width: 478,
      height: 350,
      box_count: 2,
    },
    {
      id: "21604248",
      name: "Mugatu So Hot Right Now",
      url: "https://i.imgflip.com/cv1y0.jpg",
      width: 620,
      height: 497,
      box_count: 2,
    },
    {
      id: "16464531",
      name: "But That's None Of My Business",
      url: "https://i.imgflip.com/9sw43.jpg",
      width: 600,
      height: 600,
      box_count: 2,
    },
    {
      id: "1202623",
      name: "Keep Calm And Carry On Red",
      url: "https://i.imgflip.com/pry7.jpg",
      width: 500,
      height: 704,
      box_count: 2,
    },
    {
      id: "53764",
      name: "Peter Parker Cry",
      url: "https://i.imgflip.com/15hg.jpg",
      width: 400,
      height: 992,
      box_count: 4,
    },
    {
      id: "47235368",
      name: "Good Fellas Hilarious",
      url: "https://i.imgflip.com/s4f1k.jpg",
      width: 1600,
      height: 1150,
      box_count: 2,
    },
    {
      id: "235589",
      name: "Evil Toddler",
      url: "https://i.imgflip.com/51s5.jpg",
      width: 500,
      height: 332,
      box_count: 2,
    },
    {
      id: "71428573",
      name: "Say it Again, Dexter",
      url: "https://i.imgflip.com/16iyn1.jpg",
      width: 698,
      height: 900,
      box_count: 2,
    },
    {
      id: "40945639",
      name: "Dr Evil Laser",
      url: "https://i.imgflip.com/odluv.jpg",
      width: 500,
      height: 405,
      box_count: 2,
    },
    {
      id: "7183956",
      name: "Oprah You Get A Car Everybody Gets A Car",
      url: "https://i.imgflip.com/49z6c.jpg",
      width: 620,
      height: 1004,
      box_count: 4,
    },
    {
      id: "146381",
      name: "Angry Baby",
      url: "https://i.imgflip.com/34y5.jpg",
      width: 283,
      height: 320,
      box_count: 2,
    },
    {
      id: "157978092",
      name: "Presidential Alert",
      url: "https://i.imgflip.com/2m20oc.jpg",
      width: 920,
      height: 534,
      box_count: 2,
    },
    {
      id: "56225174",
      name: "Be Like Bill",
      url: "https://i.imgflip.com/xh3me.jpg",
      width: 913,
      height: 907,
      box_count: 4,
    },
  ],
};

export const self = "15872055873@s.whatsapp.net";

export function isStory(jid) {
  return jid === "status@broadcast";
}

export async function getAdmins(gdata) {
  const admins = [];
  gdata.forEach((a, i) => {
    if (a.jid === self) return;
    if (a.isAdmin) admins.push(a.jid);
  });
  return admins;
}

export async function isAdmin(gdata, ptc) {
  const admin = [false, false];
  for (let el of gdata) {
    if (el.jid === self) admin[0] = el.isAdmin;
    if (el.jid === ptc) admin[1] = el.isAdmin;
  }
  return admin;
}

export async function getSuperAdmin(gdata) {
  for (let el of gdata) {
    if (el.isSuperAdmin) return el.jid;
  }
  return null;
}

export async function insult() {
  const options = {
    method: "GET",
    url: "https://evilinsult.com/generate_insult.php?lang=en&amp;type=json",
  };

  try {
    const res = await axios.request(options);
    return res.data;
  } catch (err) {
    return "";
  }
}

export async function jokes(type) {
  let url;
  if (type === "random") url = "https://v2.jokeapi.dev/joke/Any?type=single";
  else if (type === "programming")
    url = "https://v2.jokeapi.dev/joke/Programming?type=single";
  const options = {
    method: "GET",
    url: url,
  };

  try {
    const res = await axios.request(options);
    return res.data.joke;
  } catch (err) {
    return "";
  }
}

export async function advice() {
  const options = {
    method: "GET",
    url: "https://api.adviceslip.com/advice",
  };

  try {
    const res = await axios.request(options);
    const image = `https://api.adviceslip.com/advice/${res.data.slip.id}/img/m`;
    const data = { image: image, advice: res.data.slip.advice };
    // console.log(data);
    return data;
  } catch (err) {
    // console.log(err);
    return "";
  }
}

export async function memes(id, text) {
  const memeT = text.split("\n");
  const box = {};
  for (let i = 0; i < memeT.length; i++) box[`boxes[${i}][text]`] = memeT[i];
  const url = "https://api.imgflip.com/caption_image";
  const options = {
    method: "POST",
    url: url,
    params: {
      template_id: id,
      username: "sudomaaz",
      password: "ImG@14#1",
      ...box,
    },
  };
  try {
    const res = await axios.request(options);

    if (res.data.success) return res.data.data.url;
    else return "";
  } catch (err) {
    return "";
  }
}

export async function clist(opt, resource) {
  const dateT = DateTime.now();
  const startDay = dateT.toString();
  const endDay = dateT.plus({ days: 15 }).toString();
  let end, order, filter, data;
  if (opt === 1) {
    filter = {
      username: "sudomaaz",
      api_key: "cce9467edeec08620eda0dc3f15633ffd333d789",
      start__lte: startDay,
      end__gte: startDay,
      order_by: "-start",
      resource_id: resource,
    };
    data = "_Ongoing contests listed below_\n\n";
  } else {
    filter = {
      username: "sudomaaz",
      api_key: "cce9467edeec08620eda0dc3f15633ffd333d789",
      start__gte: startDay,
      end__lte: endDay,
      order_by: "start",
      resource_id: resource,
    };
    data = "_Upcoming contests 15 days_\n\n";
  }
  const options = {
    method: "GET",
    url: "https://clist.by/api/v2/contest/",
    params: filter,
  };

  try {
    const res = await axios.request(options);
    res.data.objects.forEach((element) => {
      const sd = DateTime.fromISO(element.start).plus({
        hours: 5,
        minutes: 30,
      });
      const ed = DateTime.fromISO(element.end).plus({ hours: 5, minutes: 30 });
      const duration = ed.diff(sd, ["days", "hours", "minutes"]).toObject();
      const stime = sd.toString().split("T");
      const etime = ed.toString().split("T");
      let days = "",
        hours = "",
        mins = "";
      if (duration.days) days = Math.floor(+duration.days) + "days ";
      if (duration.hours) hours = Math.floor(+duration.hours) + "hrs ";
      if (duration.minutes) mins = Math.floor(+duration.minutes) + "mins ";
      data +=
        "*" +
        element.event +
        " : " +
        element.resource +
        "*\n" +
        "*Start:* " +
        stime[0] +
        " " +
        stime[1] +
        "\n" +
        "*End:* " +
        etime[0] +
        " " +
        etime[1] +
        "\n" +
        "*Duration:* " +
        days +
        hours +
        mins +
        "\n" +
        "*URL:*\n" +
        element.href.trim() +
        "\n\n";
    });
    return data;
  } catch (err) {
    console.log(err);
    return "";
  }
}

export async function searchYt(yt) {
  const r = await yts(yt).catch((err) => console.log(err));

  const videos = r.videos.slice(0, 5);
  return videos;
}

export async function search(query) {
  const SUBSCRIPTION_KEY = "cda91b791adb4a0abd6ff8e2c3d9cccd";
  const options = {
    method: "GET",
    url: "https://api.bing.microsoft.com/v7.0/search/",
    params: {
      count: 5,
      offset: 0,
      q: query,
      mkt: "en-IN",
      responseFilter: "Webpages,SpellSuggestions",
    },
    headers: {
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0",
    },
  };

  try {
    const res = await axios.request(options);
    if (res.data.spellSuggestions) {
      return await search(res.data.spellSuggestions.value[0].text);
    }
    detailLog(res.data);
    return res.data.webPages.value;
  } catch (err) {
    console.log(err);
    return "";
  }
}

export async function adjustJid(jid) {
  if (!jid) return;
  let i = 0,
    exist = false,
    place = [];
  for (i = 0; i < jid.length; i++) {
    if (jid[i] === self) {
      exist = true;
      place.push(i);
    }
  }
  if (exist) {
    for (let i of place) {
      jid.splice(i, 1);
    }
    jid.unshift(self);
  }
  return jid;
}

export async function allMembers(jid) {
  const result = [];
  jid.forEach((e) => {
    result.push(e.jid);
  });
  return result;
}

export function detailLog(value) {
  console.log(JSON.stringify(value, null, 5));
}

export async function image(query) {
  const SUBSCRIPTION_KEY = "cda91b791adb4a0abd6ff8e2c3d9cccd";
  const options = {
    method: "GET",
    url: "https://api.bing.microsoft.com/v7.0/images/search",
    params: {
      count: 5,
      offset: 0,
      q: query,
      mkt: "en-IN",
    },
    headers: {
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0",
    },
  };

  try {
    const res = await axios.request(options);
    return res.data.value;
  } catch (err) {
    return "";
  }
}

export async function warningUpdate(name) {
  try {
    const url = `https://mycoolbot-41632-default-rtdb.asia-southeast1.firebasedatabase.app/warn/${name}.json`;
    let res = await axios.get(url);
    let data = res.data;
    if (data === null || data === undefined) {
      const firebase = {
          warn: 1,
          time: Date.now(),
        },
        res = await axios.put(url, firebase);
      return res.data;
    } else {
      const firebase = {
          warn: data.warn + 1,
          time: Date.now(),
        },
        res = await axios.put(
          `https://mycoolbot-41632-default-rtdb.asia-southeast1.firebasedatabase.app/warn/${name}.json`,
          firebase
        );
      return res.data;
    }
  } catch (err) {
    console.log(err);
    return "";
  }
}

export async function warningDelete(name) {
  try {
    const url = `https://mycoolbot-41632-default-rtdb.asia-southeast1.firebasedatabase.app/warn/${name}.json`;
    let res = await axios.delete(url);
    return res.data;
  } catch (err) {
    console.log(err);
    return "";
  }
}

export async function personalMsg(name) {
  try {
    const url = `https://mycoolbot-41632-default-rtdb.asia-southeast1.firebasedatabase.app/dm/${name}.json`;
    let res = await axios.get(url);
    let data = res.data;
    if (data === null || data === undefined) {
      const firebase = {
          updated: 1,
          time: Date.now(),
        },
        res = await axios.put(url, firebase);
      return true;
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function tts(speech, voice) {
  return;
  try {
    const client = new textToSpeech.TextToSpeechClient();

    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */
    // const textFile = 'Local path to text file, eg. input.txt';
    // const outputFile = 'Local path to save audio file to, e.g. output.mp3';

    const request = {
      input: { text: speech },
      voice: { languageCode: "en-IN", ssmlGender: voice },
      audioConfig: { audioEncoding: "OGG_OPUS" },
    };
    const outputFile = Date.now() + ".ogg";
    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    const res = await writeFile(
      outputFile,
      response.audioContent,
      "binary"
    ).catch((err) => {
      console.log(err);
      return false;
    });
    return outputFile;
  } catch (err) {
    console.log(err);
    return;
  }
}

export function isUrl(url) {
  return url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
      "gi"
    )
  );
}
