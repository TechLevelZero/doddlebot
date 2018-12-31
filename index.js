/* eslint no-implicit-globals: "error", consistent-return: 0, no-console: 0 */

// doddlebot 1.2.7 authors: Ben Hunter

'use strict';

const { Client, MessageEmbed } = require('discord.js');

const crypto = require('crypto');

const config = require('./json_files/config.json');

const bot = require('./json_files/data.json');

const mysql = require('mysql');

const upsidedown = require('upsidedown');

const PDFDocument = require('pdfkit');

const extIP = require('external-ip')();

var moment = require('moment-timezone');

const fs = require('fs');

let globalPlsWork;

// SQL config
const dbConfig = {
  host: '10.100.1.18',
  user: 'Admin',
  password: config.mysqlpass,
  database: 'doddlecord',
  charset: 'utf8mb4',
};

///////////////////////
///  Function land  ///
///////////////////////

// SQL connection handleing
let con;
function handleDisconnect() {
  con = mysql.createConnection(dbConfig);
  con.connect((err) => {
    if (err) {
      console.log('error when connecting to db:', err);
      console.log('DATABASE = doddlebot');
      setTimeout(handleDisconnect, 2000);
    }
  });
  con.on('error', (err) => {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}
// Points data w/o mod or managers data,
/**
 * Gets the top x users, excluding mods
 * @param  {Object} message - A discord.js message object
 * @param  {number} x - The number of users you want to retrive
 * @param  {string} mode - "total" or "weekly"
 * @returns {Object} - A discord.js embed with the top x members
 */
function topx(message, x, mode, callback) {
  var queery = ""; // geddit? It's because we're all gay.
  var title = "";

  // Gets mods and managers
  var modIds = message.guild.roles.get('376873845333950477').members.map(m => m.id);
  var managersIDs = message.guild.roles.get('337016459429412865').members.map(m => m.id);
  var toRequest = (modIds.length + managersIDs.length) + Number(x);

  if (mode == "total") {
    queery = `SELECT userid, username, level, points, totalpoints FROM userpoints ORDER BY totalpoints DESC LIMIT ${toRequest}`;
    title = `doddlecord's top ${x} of all time`;
  } else if (mode == "weekly") {
    queery = `SELECT userid, username, level, points, totalpoints FROM weeklypoints ORDER BY totalpoints DESC LIMIT ${toRequest}`;
    title = `doddlecord's top ${x} this week`;
  }

  con.query(queery, (err, result) => {
    var topxArray = [];

    for (var i = 0; i < result.length; i++) {
      if (!(modIds.includes(result[i].userid))) { // If the user isn't a mod
        if (!(managersIDs.includes(result[i].userid))) { // If the user isn't a manager
          if (topxArray.length < x) { // If the top x still has room
            topxArray.push(result[i]);
          }
        }
      }
    }
    console.log("Sorted (Excluding mods) limited to x length", topxArray);
    globalPlsWork = topxArray;
    callback();
  });
}
// returns channel collection
/**
 * All the available channels
 * @param  {string} channel
 * - available channels
 * - secrets-for-the-joshes
 * - secrets-for-the-mods
 * - secrets-for-the-bot
 * - test-facility
 * - rules
 * - new-videos
 * - announcements
 * - suggested-servers
 * - server-suggestions
 * - introduce-yourself
 * - general
 * - serious
 * - media
 * - selfies
 * - artist-talk
 * - music-talk
 * - concert-talk
 * - lgbtq-plus-talk
 * - pets-and-animals
 * - dr-who-and-mcm
 * - nerd-talk
 * - memes-bois
 * - fun-with-bots
 * - mc-server
 * - voice-chat 
 * @returns {Object} - A channel object
 */
function channel(channel) {
  return client.channels.get(bot.channels[channel])
}
// adds or removes roles
/**
 * Role function 
 * @param  {string} AOR - 'add' or 'remove'
 * @param  {Object} message - message Obj passthought
 * @param  {Object} role - role id
 */
function role(AOR, message, role) {
  message.guild.members.get(message.author.id).roles[AOR](role);
}

/**
 * MemberSQL function 
 * @param  {string} memberID - Members's discord ID
 */
function memberData(data) {
  const memberIDAray = [
    [`${data}`],
  ];
  con.query('INSERT INTO members (`userid`) VALUES ?', [memberIDAray], (err) => { if (err) throw err; });
}

/**
 * loggerSQL function 
 * @param  {string} type - Types of logs
 * - system 
 * - info
 * - error
 * @param  {object} member - Members's discord collection
 * @param  {string} data - Text data you want to log
 */
function logger(type, member, data) {
  var post  = {"type": type, 'userid': member.id, 'message':data};
  var query = con.query('INSERT INTO logger SET ?', post, function (error, results, fields) {
    if (error) throw error;
    // Neat!
  });
  console.log(query.sql);
}

handleDisconnect();

const client = new Client();

// Discord login, looks to see if in DEV or STABLE branch
if (__dirname.match('STABLE')) {
  client.login(config.token);
} else {
  client.login(config.DEVtoken);
}

// Discord error handleing
client.on('error', e => console.error(e));
client.on('warn', e => console.warn(e));
client.on('debug', e => console.info(e));

// Loads logs and sets activity
client.on('ready', () => {
  console.log(client.guilds.get('337013993669656586').members.filter(m => m.presence.status === 'online').size);
  con.query('UPDATE commandusage SET count = count + 1 WHERE command = "build"');
  client.user.setActivity('for zelda', { type: 'WATCHING' });
  console.log(`Logged in as ${client.user.username} ${bot.system.ver}`);
  con.query(`SELECT type, time, message FROM logger WHERE type = "system" ORDER BY time ASC`, (err, result) => {
    if (err) throw err;
    var x;
    for (x in result) {
      console.log(`${result[x].type}: @${result[x].time}, ${result[x].message}`);
    }
  });
  console.log('ARCHIVE LOADED');
});

// New memeber procedure
client.on('guildMemberAdd', (member) => {
  message = member
  function roleAM2(AOR, message, role) {
    message.guild.members.get(message.id).roles[AOR](role);
  }
  function welcomeEmbed() {
    channel('introduce-yourself').send(`${member.guild.members.get(member.id)}`);
    const embed = new MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Welcome to doddlecord!**')
      .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
      .setDescription(bot.text.welcomemsg);
    channel('introduce-yourself').send(embed)
  }
  console.log(`${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
  logger('info' , member, `${member.user.tag} has joined ${member.guild.name}`);

  con.query(`SELECT * FROM intro WHERE userid = ${member.id}`, (err, result) => {
    if (typeof result[0] != 'undefined') {
      if (result[0].score > 1000) {
        channel('introduce-yourself').send(`Hey ${member.guild.members.get(member.id)} welcome back! Looks like you where a member`);
        roleAM2('add', member, bot.role.memberid);
      } else {
        memberData(member.id);
        welcomeEmbed()
      }
    } else {
      memberData(member.id);
      welcomeEmbed()
    }
  });
});

client.on('guildMemberRemove', (remember) => {
  if (remember.id !== '394816921989545985') {
    console.log(`${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
    logger('info' , remember, `${remember.user.tag} Has left ${remember.guild.name}`);
    channel('general').send(`${remember.user.tag.slice(0, -5)} Has left ${remember.guild.name}, hopefully we see them again soon!`)
  }
});

let perscommandList = [];

let key = Object.keys(bot.newRoles)

for (key in bot.newRoles) {
  perscommandList.push(key);
}
perscommandList = perscommandList.join("\n");

client.on('message', (message) => {

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  message.content = message.content.toLowerCase();
  if (message.content === 'd!kill') {
    if (message.member.roles.has(bot.role.managersjoshesid) || (message.author.id === '394424134337167360')) {
      logger('system' , message.author, `${message.author.tag} Had shutdown doddlebot')`);
      process.exit();
    }
  }

  // const msgCount = count(message.cleanContent);
  var pattern = /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;

  var m = message.content.match(pattern);
  var count = 0;
  if (!m) {
    return 0;
  }
  for (var i = 0; i < m.length; i++) {
    if (m[i].charCodeAt(0) >= 0x4e00) {
      count += m[i].length;
    } else {
      count += 1;
    }
  }

  if (message.author.bot) return;

  if (message.channel.type === 'dm') {
    if (message.content === 'd!why') {
      message.channel.send("We keep you data for 90 days so if you rejoin doddlecord roles are automatically added so you don't have to, and thats it really");
    }
    if (message.content === 'd!data') {
      con.query('UPDATE commandusage SET count = count + 1 WHERE command = "data"');
      logger("system", message.author, 'A member had requested their data')
      message.channel.send('This will take a bit');

      // grab every bit of data where the author's id is
      con.query(`SELECT * FROM * WHERE userid = ${message.author.id}`, (err, result) => {
        
      });
      con.query(`SELECT * FROM archive WHERE userid = ${message.author.id}`, (err, result) => {
        const resultJson = JSON.stringify(result);
        const results = resultJson.replace(/messagecount/g, 'wordcount').replace(/:/g, '=').replace(/{"/g, '\r').replace(/"}/g, '\r');
        const results1 = results.replace(/"/g, ' ');
        con.query(`SELECT * FROM members WHERE userid = ${message.author.id}`, (err, result) => {
          if (result.length > 0) {
            const resultJson1 = JSON.stringify(result);
            const yes = resultJson1.replace(/"1"/g, '"Yes"');
            const no = yes.replace(/"0"/g, '"No"');
            const colour = no.replace(/"colour":"Yes"/g, '"colour":"Lime"');
            const colour2 = colour.replace(/"colour":"2"/g, '"colour":"Rose"');
            const colour3 = colour2.replace(/"colour":"3"/g, '"colour":"Blue Sky"');
            const colour4 = colour3.replace(/"colour":"4"/g, '"colour":"Light Violet"');
            const colour5 = colour4.replace(/"colour":"5"/g, '"colour":"Aqua"');
            const colour6 = colour5.replace(/"colour":"6"/g, '"colour":"dodie yellow"');
            const resultParse = JSON.parse(colour6.slice(1, -1));
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(`./tmp/${message.author.id}.pdf`));
            doc.font('./fonts/Roboto-Thin.ttf')
              .fontSize(11);
            doc.image('./imgs/hiresdoddlecord.PNG', {
              fit: [475, 200],
              align: 'center',
            });
            doc.text(`\nYour data ${message.author.tag}`, { align: 'center' });
            doc.text(bot.text.gdpr);
            doc.addPage();
            var text = ['User ID', 'Is/was a member', 'colour', 'Female', 'Male', 'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Pansexual', 'Agender', 'Non-binary', 'Genderfluid', 'Transgender', 'He/Him', 'She/Her', 'They/Them', 'Musician', 'Artist', 'MemeTrash'];
            var data = ['userid', 'wasmember', 'colour', 'female', 'male', 'straight', 'gay', 'lesbian', 'bisexual', 'asexual', 'pansexual', 'agender', 'nonbinary', 'fluid', 'trans', 'hehim', 'sheher', 'theythem', 'musician', 'artist', 'memetrash'];
            for (let i = 0; i < text.length; i++) {
              doc.text(`${text[i]}: ${resultParse[data[i]]}`, { align: 'center' });
              doc.moveDown();
            }
            doc.moveDown();
            doc.moveDown();
            con.query(`SELECT * FROM userpoints WHERE userid = ${message.author.id}`, (err, result1) => {
              if (result1.length > 0) {
                const resultJsonObj1 = JSON.stringify(result1);
                const results1 = JSON.parse(resultJsonObj1.slice(1, -1));
                doc.text('Points Data', { align: 'center' });
                doc.moveDown();
                doc.text(`Level: ${results1.level},  Points: ${results1.points}`, { align: 'center' });
              } else {
                doc.text("we can't find any points data on you", { align: 'center' });
              }
            });
            setTimeout(() => {
              doc.addPage()
                .fontSize(10)
                .text(`${results1}`, 75, 75);
              doc.text('If you think something is wrong please give @botdev a ping on doddlecord', 20, doc.page.height - 50, { lineBreak: false });
              doc.end();
            }, 3000);
          } else {
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(`./tmp/${message.author.id}.pdf`));
            doc.font('./fonts/Roboto-Thin.ttf')
              .fontSize(11);
            doc.image('./imgs/hiresdoddlecord.PNG', { fit: [475, 200], align: 'center' });
            doc.text(`\nYour data ${message.author.tag}`, { align: 'center' });
            doc.text(bot.text.gdpr);
            doc.addPage();
            doc.text('We have no role data on you, you must have joined before 01/04/18', { align: 'center' });
            doc.moveDown();
            con.query(`SELECT * FROM userpoints WHERE userid = ${message.author.id}`, (err, result11) => {
              if (result11.length > 0) {
                const resultJsonObj11 = JSON.stringify(result11);
                const results11 = JSON.parse(resultJsonObj11.slice(1, -1));
                doc.text('Points Data', {
                  align: 'center',
                });
                doc.moveDown();
                doc.text(`Level: ${results11.level},  Points: ${results11.points}`, { align: 'center' });
              } else {
                doc.text("we can't find any points data on you", { align: 'center' });
              }
            });
            setTimeout(() => {
              if (results1.length > 5) {
                doc.addPage()
                  .fontSize(10)
                  .text(`${results1}`, 75, 75);
                doc.text('If you think something is wrong please give @botdev a ping on doddlecord', 20, doc.page.height - 50, { lineBreak: false });
                doc.end();
              } else {
                doc.moveDown();
                doc.text("We can't find any message metadata on you", { align: 'center' });
                doc.text('If you think something is wrong please give @botdev a ping on doddlecord', 30, doc.page.height - 35, { lineBreak: false });
                doc.end();
              }
            }, 3000);
          }
        });
        // message.delete(1);
        setTimeout(() => {
          message.channel.send('Your Data:', {
            files: [`./tmp/${message.author.id}.pdf`],
          });
        }, 45000);
        setTimeout(() => {
          fs.stat(`./tmp/${message.author.id}.pdf`, (err66) => {
            if (err66) {
              return console.error(err66);
            }
            // keeping PDF for debugging for 1.2.7
            /*
            setTimeout(() => {
              fs.unlink(`./tmp/${message.author.id}.pdf`, (err7723) => {
                if (err7723) return console.log(err7723);
                console.log('file deleted successfully');
              });
            }, 60000);
            */
          });
        }, 5000);
      });
    }

    // this will stop data being collected against your discord ID.
    // we will still store your message metadata but it will
    // not be stored with your discord ID or username

    if (command === 'forget') {
      if (args[0] === 'yes') {
        con.query(`DELETE FROM members WHERE userid = ${message.author.id}`);
        con.query(`DELETE FROM userpoints WHERE userid = ${message.author.id}`);
        con.query(`DELETE FROM weeklypoints WHERE userid = ${message.author.id}`);
        con.query(`UPDATE archive SET userid = 00000 WHERE userid = ${message.author.id}`);
        message.channel.send('Your data is being deleted and anonymised, this can take up to 3 minutes. A message will be sent to you when completed');
      } else {
        con.query('UPDATE commandusage SET count = count + 1 WHERE command = "forget"');
        message.channel.send('This will remove all data doddlebot has on your account including your points. Now this only delete current data and is more of a reset to your data. If you are ok with this use `d!forget yes` and we will begin deleting your data');
      }
    }
    if (message.content === 'd!optout') {
      message.channel.send('this will stop data being collected against your discord ID. we will still store your message metadata but it will not be stored with your discord ID or username');
    }
    if (message.content === 'd!serious') {
      message.channel.send('Now you can type your message and then, when your done, type d!send. It will prompt you and give you a preview of the message before it sends');
      con.query(`UPDATE archive SET messagecount = messagecount + ${msgCount} WHERE id = 0`);
    }
    console.log('i recieved a DM');
  } else {
    const pointsRandom = (Math.floor(Math.random() * 18) + 5);
    if (message.content.length > 13) {
      con.query(`SELECT * FROM userpoints WHERE userid = ${message.author.id}`, (err, result) => {
        if (result.length > 0) {
          // ARRAY THIS
          con.query(`UPDATE userpoints SET points = points + ${pointsRandom} WHERE userid = ${message.author.id}`);
          con.query(`UPDATE userpoints SET totalpoints = totalpoints + ${pointsRandom} WHERE userid = ${message.author.id}`);
          con.query(`UPDATE userpoints SET pointscombined = pointscombined + ${pointsRandom} WHERE id = 5`);
          if (result[0].level * 100 < result[0].points) {
            con.query(`UPDATE userpoints SET points = 0 WHERE userid = ${message.author.id}`);
            con.query(`SELECT totalpoints FROM userpoints WHERE userid = ${message.author.id}`, (err4, totalPointsResult) => {
              console.log(totalPointsResult)
              console.log(totalPointsResult[0])
              console.log(totalPointsResult[0].totalpoints)
              const resultJsonObjTotalPoints = JSON.stringify(totalPointsResult);
              const totalPointsSlice = resultJsonObjTotalPoints.slice(16, -4);
              const totalpoints = totalPointsSlice.concat('00');
              con.query(`UPDATE userpoints SET totalpoints = ${totalpoints} WHERE userid = ${message.author.id}`);
              setTimeout(() => {
                con.query(`SELECT userid, username FROM userpoints WHERE userid = ${message.author.id}`, (err, result) => {
                  if (result[0].username != message.member.displayName) {
                    con.query(`UPDATE userpoints SET username = ? WHERE userid = ${message.author.id}`, [message.member.displayName]);
                  }
                });
                con.query(`SELECT userid, name FROM archive WHERE userid = ${message.author.id}`, (err, result) => {
                  if (result[0].username != message.member.displayName) {
                    con.query(`UPDATE archive SET name = ? WHERE userid = ${message.author.id}`, [message.member.displayName]);
                  }
                });
                var modIds = message.guild.roles.get('376873845333950477').members.map(m => m.id);
                var managersIDs = message.guild.roles.get('337016459429412865').members.map(m => m.id);
                if (!(modIds.includes(message.author.id))) {
                  if (!(managersIDs.includes(message.author.id))) {
                    con.query(`SELECT userid, username FROM weeklypoints WHERE userid = ${message.author.id}`, (err, result) => {
                      if (result[0].username != message.member.displayName) {
                        con.query(`UPDATE userpoints SET username = ? WHERE userid = ${message.author.id}`, [message.member.displayName]);
                      }
                    });
                  }
                }
              }, 500);
            })
            con.query(`UPDATE userpoints SET level = level + 1 WHERE userid = ${message.author.id}`);
            console.log(`${message.author} Levelled up`);
            logger('info' , message.author, `${message.author.tag} has leveled up`);
            if (message.channel.name !== 'serious') {
              con.query(`SELECT * FROM userpoints WHERE userid = ${message.author.id}`, (err4, pointsResult) => {
                message.channel.send(`You are now level ${pointsResult[0].level}, ${message.author}`);
              });
            }
          }
        } else {
          const newUser = [
            [`${message.author.id}`, `${message.member.displayName}`, 1, 0],
          ];
          con.query('INSERT INTO userpoints (`userid`,`username`, `level`, `points`) VALUES ?', [newUser], (err3) => {
            if (err3) throw err3;
            console.log('A new member has been added to the points list');
          });
        }
      });
    }

    const messageContent = [
      [`${message.author.id}`, `${message.member.displayName}`, `${message.channel.name}`, `${count}`, `${pointsRandom}`],
    ];
    con.query('INSERT INTO archive (`userid`, `name`, `channel`, `messagecount`, `pointsgained`) VALUES ?', [messageContent], (err3) => {
      if (err3) throw err3;
      console.log('Message Metadata Archived');
    });
    con.query(`UPDATE archive SET messagecount = messagecount + ${count} WHERE id = 0`);
    
    if (message.member.roles.has(bot.role.managersjoshesid)) {
      // ESlint
    } else if (message.member.roles.has(bot.role.modsid)) {
      // ESlint
    } else if (message.content.length > 2) {
      const pointsRandom = (Math.floor(Math.random() * 22) + 9);

      con.query(`SELECT * FROM weeklypoints WHERE userid = ${message.author.id}`, (err, result) => {
        if (result.length > 0) {
          con.query(`UPDATE weeklypoints SET points = points + ${pointsRandom} WHERE userid = ${message.author.id}`);
          con.query(`UPDATE weeklypoints SET totalpoints = totalpoints + ${pointsRandom} WHERE userid = ${message.author.id}`);
          if (result[0].level * 100 < result[0].points) {
            con.query(`UPDATE weeklypoints SET points = 0 WHERE userid = ${message.author.id}`);
            con.query(`SELECT totalpoints FROM weeklypoints WHERE userid = ${message.author.id}`, (err4, totalPointsResult) => {
              const resultJsonObjTotalPoints = JSON.stringify(totalPointsResult);
              const totalPointsSlice = resultJsonObjTotalPoints.slice(16, -4);
              const totalpoints = totalPointsSlice.concat('00');
              con.query(`UPDATE weeklypoints SET totalpoints = ${totalpoints} WHERE userid = ${message.author.id}`);

            });
            con.query(`UPDATE weeklypoints SET level = level + 1 WHERE userid = ${message.author.id}`);
          }
        } else {
          const newUser = [
            [`${message.author.id}`, `${message.member.displayName}`, 1, 0],
          ];
          con.query('INSERT INTO weeklypoints (`userid`,`username`, `level`, `points`) VALUES ?', [newUser], (err3) => {
            if (err3) throw err3;
            console.log(`${message.author} is now in this weeks, weeklypoints`);
          });
        }
      });
    }
    
    // removes or bans ads messages and bots
    if (message.channel.name !== 'suggested-servers') {
      if (message.content.match('discord.gg/')) {
        message.delete(1);
      }
    }
    if (message.author.tag.match('discord.gg/')) {
      message.member.kick(message.author.id);
    }

    if (!message.member.roles.has(bot.role.memberid)) {
      function autoMember() {
        console.log('in')
        const cont = message.cleanContent.toLowerCase();
        con.query(`SELECT * FROM intro WHERE userid = ${message.author.id}`, (err2, result) => {
          if (result.length > 0) {
            for (var word in bot.lookup) {
              if (cont.indexOf(word) != -1) {
                if (bot.lookup[word] < 0) {
                  console.log(bot.lookup[word]*-1)
                  con.query("UPDATE intro SET score = score - " + (bot.lookup[word]*-1) + " WHERE userid = " + message.author.id);
                } else {
                  console.log(bot.lookup[word]*-1 + ' in else')
                  con.query("UPDATE intro SET score = score + " + bot.lookup[word] + " WHERE userid = " + message.author.id);
                }
              }
            }
            if (result[0].score !== -3000000) {
              if (count > 14) {
                con.query(`UPDATE intro SET score = score * 3 WHERE userid = ${message.author.id}`);
              }
              con.query(`UPDATE intro SET score = score + ${count} WHERE userid = ${message.author.id}`);
              con.query(`UPDATE intro SET score = score / 4 WHERE userid = ${message.author.id}`);
              con.query(`SELECT score FROM intro WHERE userid = ${message.author.id}`, (err, result) => {
                if (result[0].score >= 1000) {
                  console.log('final score over 1000')
                  const contentHashed = crypto.createHmac('sha512', config.key).update(cont).digest('hex');
                  con.query('SELECT hash FROM intro', (err, result19) => {
                    const resultJson1 = JSON.stringify(result19);
                    if (resultJson1.match(contentHashed)) {
                      con.query(`UPDATE intro SET score = - 3000000 WHERE userid = ${message.author.id}`);
                      channel('secrets-for-the-mods').send(`${message.author.tag} copied a intro word for word, keep an eye on them!`);
                    } else {
                      con.query(`UPDATE intro SET hash = '${contentHashed}' WHERE userid = ${message.author.id}`);
                      con.query(`UPDATE members SET wasmember = 1 WHERE userid = ${message.author.id}`);
                      role('add', message, bot.role.memberid);
                      logger('info' , message.author, `${message.author.tag} had been added by doddlebot'`);

                      message.channel.send('Your intro was so good I was able to tell!, I have added you as a member. Welcome to doddlecord! ' + result[0].score);
                      console.log(`${message.author.tag} has been added by doddlebot`);
                    }
                  });
                }
              });
            }
          } else {
            const newIntro = [
              [`${message.author.id}`, 0],
            ];
            con.query('INSERT INTO intro (`userid`, `score`) VALUES ?', [newIntro], (err3) => {
              if (err3) throw err3;
            });
            autoMember();
          }
        });
      }
      con.query(`SELECT score FROM intro WHERE userid = ${message.author.id}`, (err, result) => {
        if (result.length > 0) {
          autoMember();
        }
      });
    }

    if (message.content.indexOf(config.prefix) !== 0) return;

    // colour stuff
    if (command === 'colour') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      function removeColours() {
        role('remove', message, bot.role.limeid);
        role('remove', message, bot.role.roseid);
        role('remove', message, bot.role.blueskyid);
        role('remove', message, bot.role.lightvioletid);
        role('remove', message, bot.role.aquaid);
        role('remove', message, bot.role.yellowid);
      }
      const colour = args[0];
      let mark = false;
      var colours = ['lime', 'rose', 'bluesky', 'lightviolet', 'aqua', 'yellow'];
      for (let i = 0; i < colours.length; i++) {
        if (colour === colours[i]) {
          if (message.member.roles.has(bot.role[colours[i].concat("id")])) {
            message.reply(`you have already have ${colours[i]}`);
          } else {
            removeColours();
            role('add', message, bot.role[colours[i].concat("id")]);
            message.reply(`you now have the ${colours[i]} colour!`);
          }
        } else if (colour === 'remove') {
          mark = 'remove';
        }
      }
      // r/OutOfTheLoop
      if (mark === 'remove') {
        removeColours();
        message.reply(`you have removed your colour`);
      }
    }
    // End of colour stuff

    // personality stuff
    if (command === 'pers') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      if (message.member.roles.has(bot.role.memberid)) {
        const per0 = args[0];
        const per1 = args[1];
        let peradded1 = [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]];
        let embed = new MessageEmbed();
        let changed = [];
        let state = 'NA';
        embed.setColor(0xFEF65B);
        if (per0 === 'remove') {
          embed.setTitle('Personality roles removed:');
          state = 'removed';
        } else {
          embed.setTitle('Personality roles added:');
          state = 'added';
          peradded1.unshift('added');
        }
        if (per1 === 'all') {
          if (per0 === 'remove') {
            const toRemove = ['gay', 'straight', 'bisexual', 'asexual', 'pansexual', 'female', 'male', 'lesbian', 'nonbinary', 'fluid', 'agender', 'hehim', 'sheher', 'theythem', 'trans'];
            for (let i = 0; i < toRemove.length; i++) {
              role('remove', message, bot.role[toRemove[i].concat("id")]);
            }
            message.reply('All personal roles have been removed');
          }
        } else {
          let mark = false;
          for (key in bot.newRoles) {
            // It's running for every one found
            if (peradded1.indexOf(key) != -1) {
              mark = true;
              changed.push(key);
              // Set role
              if (per0 === 'remove') {
                role('remove', message, bot.role[bot.newRoles[key]]);
              } else {
                role('add', message, bot.role[bot.newRoles[key]]);
                embed.setDescription(key);
              }
            }
          }
          // r/OutOfTheLoop
          if (!mark) {
            message.channel.send(`${message.author} example: d!pers gay male memetrash [For help type d!persroles]`);
          } else {
            embed.setDescription(changed.join('\n'));
            message.channel.send({ embed });
            logger('info' , message.author, `${message.author.tag} has ${state} ${peradded1.slice(1)}`);
          }
        }
      } else {
        message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
        console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
        logger('info' , message.author, `${message.author.tag} was trying to add a personality role, but is not a member`);
      }
    }

    // end of personality stuff

    // const ts = Math.round((new Date()).getTime() / 1000);
    // if (command === 'humanpoints') {
    //   con.query(`SELECT * FROM ultimate WHERE userid = ${message.author.id}`, (err2, result) => {
    //     if (result.length > 0) {
    //       if (result[0].epoch + 600 < ts) {
    //         con.query(`UPDATE ultimate SET score = score + 10, epoch = ${ts} WHERE userid = ${message.author.id}`);
    //         message.channel.send('Points collected!');
    //         if (result[0].score === 30) {
    //           message.member.send('Hey, it looks like you are dedicated! \n\nPlesse be aware if you win, you will have to give your adress (can be home, work or PO box) to the admins. If you are under 18 please ask your parents or guardians if this ok and seek permision to continue with the giveaway \n\nGood Luck, \nManager Joshes');
    //         }
    //       } else {
    //         message.channel.send('You have already entered in the past 10 minutes, try again soon!');
    //       }
    //     } else {
    //       const ultimateNew = [
    //         [`${message.author.id}`, `${message.author.tag}`, 10, ts],
    //       ];
    //       con.query('INSERT INTO ultimate (`userid`, `name`, `score`, `epoch`) VALUES ?', [ultimateNew], (err3) => {
    //         if (err3) throw err3;
    //       });
    //       message.channel.send('Points collected!');
    //     }
    //   });
    // }

    if (command === 'serverinfo') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setDescription(`**__${message.guild.name} Details__**`)
        .setThumbnail(message.guild.iconURL)
        .addField('Members', `${message.guild.memberCount - message.guild.members.filter(member => member.user.bot).size} Members`)
        .addField('Bots', `${message.guild.members.filter(member => member.user.bot).size} Bots`)
        .addField('Channels', `${message.guild.channels.filter(chan => chan.type === 'voice').size} voice / ${message.guild.channels.filter(chan => chan.type === 'text').size} text`)
        .addField('Mods', message.guild.roles.get('376873845333950477').members.map(m => m.user).join(', '))
        .addField('Managers', message.guild.roles.get('337016459429412865').members.map(m => m.user).join(', '));
      message.channel.send({ embed });
    }

    if (command === 'colourroles') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Colour Role Help**')
        .setDescription('This is the command to add colour to your name in doddlecord!')
        .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
        .addField('**Colour Commands**', (bot.commandLists.colour));
      message.channel.send({ embed });
    }

    if (command === 'help') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Help**')
        .setDescription('Looking for help? yes...well look below for the category you need help with!')
        .addField('**Commands**', (bot.commandLists.catogery));
      message.channel.send({ embed });
    }

    if (command === 'timehelp') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Time help**')
        .setDescription(bot.commandLists.time)
      message.channel.send({ embed });
    }

    if (command === 'persroles') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Personal Role Help**')
        .setDescription('Personal roles are added to give a little info on who you are to other members of doddlecord. They are completely optional roles though. Make __shore__ you spell it correctly and have a **capital letter** for each role or it will not add them!')
        .addField('Use', bot.text.colouruse)
        .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
        .addField('**Commands**', (perscommandList));
      message.channel.send({ embed });
    }

    if (command === 'allhelp') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**All Help**')
        .setDescription('Every command I can do!')
        .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
        .addField('**Category Commands**', (bot.commandLists.catogery))
        .addField('**Other Commands**', (bot.commandLists.other))
        .addField('**Colour Commands**', (bot.commandLists.colour))
        .addField('**Personal Commands**', (perscommandList));
      message.channel.send({ embed });
    }

    if (command === 'extras') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Extra Help**')
        .setDescription('Just some extra commands that doddlebot can do!')
        .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
        .addField('**Extra Commands**', (bot.commandLists.other));
      message.channel.send({ embed });
    }

    if (command === 'ukhelplines') {
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('UK Helplines')
        .setDescription(bot.text.uk);
      message.channel.send({ embed });
    }

    if (command === 'ushelplines') {
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('USA Helplines')
        .setDescription(bot.text.us);
      message.channel.send({ embed });
    }

    if (command === 'ping') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const ping = Math.round(client.ping);
      message.channel.send(`Ping is ${ping}ms`);
      logger('system' , message.author, `Ping was ${ping}ms`);
    }

    if (message.channel.name === 'secrets-for-the-mods') {
      if (command === 'thisweekstop5') {
        topx(message, 5, "weekly", () => {
          const embed = new MessageEmbed()
          embed.setColor(0xFEF65B)
          embed.setTitle("doddlecord's Top 5 of this week")
          for (var j = 0; j < globalPlsWork.length; j++) {
            embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
          }
          message.channel.send({ embed });
          message.channel.send('Is this ok to send and use? (d!send)');
        });
      }
    }

    if (message.channel.name === 'secrets-for-the-mods') {
      if (command === 'send') {
        topx(message, 5, "weekly", () => {
          const embed = new MessageEmbed()
          embed.setColor(0xFEF65B)
          embed.setTitle("doddlecord's Top 5 of this week")
          for (var j = 0; j < globalPlsWork.length; j++) {
            embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
            message.guild.members.get(globalPlsWork[j].userid).roles['add'](bot.role.top5);
          }
          channel('announcements').send({ embed });
        });
        message.channel.send('30s till weeklypoints is TRUNCATED use `d!kill` to stop');
        setTimeout(() => {
          con.query('TRUNCATE TABLE weeklypoints');
          console.log('WEEKLYPOINTS TABLE HAS BEEN TRUNCATED');
          logger('system' , message.author, 'WEEKLYPOINTS TABLE WAS TRUNCATED');
        }, 30000)
      }
    }

    if (message.channel.name === 'secrets-for-the-mods') {
      if (command === 'updateembed') {
        // channel('announcements').send('@everyone');
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('doddlebot 1.2.6 The Time Update')
          .addField('d!time', 'This shows the local time of the member use: `d!timehelp` for more info')
          .addField('d!top [number]', 'Now d!top10 can use any number up to 25 use: `d!top [number]')
          .addField('d!mcserver', 'This will show the version and the IP of the MC server')
          .addField('d!forget', 'In DMs with doddlebot you can remove all your data now, use the command `d!forget` for more info')
          .addField('Bug fixes', 'doddlebot should no longer welcome members back who have never been here before, hopefully it\'s a weird bug')
          .addField('Upcoming features', 'Opting out of doddlebot data completely is beeing worked on');
        channel('announcements').send({ embed });
      }
    }
    // Boo!
    if (command === 'uptime') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      function format(seconds) {
        function pad(s) {
          return (s < 10 ? '0' : '') + s;
        }
        const hours = Math.floor(seconds / (60 * 60));
        const minutes = Math.floor(seconds % (60 * 60) / 60);
        var seconds = Math.floor(seconds % 60);

        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
      const uptime = process.uptime();
      message.channel.send(format(uptime)).then((msg) => {
        var interval = setInterval(() => {
          const uptime1 = process.uptime();
          msg.edit(format(uptime1))
        }, 2000)
        interval
        setTimeout(() => {
          clearInterval(interval);
        }, 120000)
      });
    }

    if (message.channel.name === 'secrets-for-the-bot') {
      if (command === 'cute') {
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('The **8th** of the **8th** Save the date');
        channel('announcements').send({ embed });
      }
    }

    if (message.channel.name === 'secrets-for-the-mods') {
      if (command === 'newpartner') {
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('Doddlecord')
          .setDescription('We are the Queen Discord Server, we are a friendly bunch who love to talk about Queen in general and some of rock artists/80s bands as well. Hop on in and join us, we would love to have you on board in our community!')
          .setImage('https://cdn.discordapp.com/attachments/465258780205121558/465264691787333652/queen_banner.png');
        channel('suggested-servers').send({ embed });
        channel('suggested-servers').send('https://discord.gg/UEthcUc');
      }
    }

    if (message.channel.name === 'secrets-for-the-joshes') {
      if (command === 'sendupdate') {
        // message.guild.channels.find('name', 'announcements').send('@everyone');
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('Human EP')
          .setDescription('With the announcement of the Human EP we are giving away 1 **signed ultimate human bundle!** This is a worldwide giveaway! To enter use the command __d!humanpoints__ **every 8 hours** and rack up the points till the 1st of December. The winner the be announced shortly after! \n\n Good Luck!')
          .setImage('https://media.discordapp.net/attachments/358175378998689792/492777259346821136/Screenshot_20180921-185643_Chrome.jpg');
        channel('announcements').send({ embed });
      }
    }

    if (command === 'rank') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      if (args[0] != null) {
        con.query(`SELECT * FROM userpoints WHERE userid = "${message.content.replace(/\D/g, '')}"`, (err, result) => {
          if (result[0] != null) {
            const embed = new MessageEmbed()
              .setColor(0xFEF65B)
              .setTitle(`Rank Of ${result[0].username}`)
              .addField('Level', (result[0].level))
              .addField('Points', (result[0].points))
              .addField('There Next Level In', `${(result[0].level * 100) - result[0].points} Points`)
              .setFooter(`Total points gained: ${result[0].totalpoints}`);
            message.channel.send({ embed });
          } else { message.channel.send("can't find any points on this member. `d!rank` for your own rank or `d!rank @user` to get anothers users rank"); }
        });
      } else {
        con.query(`SELECT * FROM userpoints WHERE userid = "${message.author.id}"`, (err, result) => {
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle(`**Your Rank ${message.member.displayName}**`)
            .addField('**Level**', (result[0].level))
            .addField('**Points**', (result[0].points))
            .addField('Next Level In', `${(result[0].level * 100) - result[0].points} Points`)
            .setFooter(`Total points gained: ${result[0].totalpoints}`);
          message.channel.send({ embed });
        });
      }
    }
    // ababa
    if (command === 'stats') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      con.query('SELECT pointscombined FROM userpoints WHERE id = 5', (err, result) => {
        con.query('SELECT id, messagecount FROM archive ORDER BY id DESC LIMIT 1', (err1, result1) => {
          con.query('SELECT messagecount FROM archive WHERE id = 0', (err2, result2) => {
            const embed = new MessageEmbed()
              .setColor(0xFEF65B)
              .setTitle(`${message.guild.name} Details`)
              .addField('Members', `${message.guild.memberCount - message.guild.members.filter(member => member.user.bot).size} Members`)
              .addField('Bots', `${message.guild.members.filter(member => member.user.bot).size} Bots`)
              .addField('Channels', `${message.guild.channels.filter(chan => chan.type === 'voice').size} voice / ${message.guild.channels.filter(chan => chan.type === 'text').size} text`)
              .addField('Message Count', result1[0].id)
              .addField('Wordcount', result2[0].messagecount)
              .addField('Points given out', result[0].pointscombined);
            message.channel.send({ embed });
          });
        });
      });
      topx(message, 5, "total", () => {
        const embed = new MessageEmbed()
          .setTitle('Top 5 of all time')
          .setColor(0xFEF65B)
        for (var j = 0; j < globalPlsWork.length; j++) {
          embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
        }
        message.channel.send({ embed });
      });
      // Bot commands used
      con.query('SELECT command, count FROM commandusage', (err, result) => {
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('Command Usage');
        for (let i = 0; i < 18; i++) {
          embed.addField(`${result[i].command}`, `used ${result[i].count} time(s)`);
        }
        message.channel.send({ embed });
      });
    }

    if (command === 'top') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const arg = parseInt(args[0]);
      const embed = new MessageEmbed()
      if (arg > 25) {
        topx(message, 25, "total", () => {
          embed.setColor(0xFEF65B)
          embed.setFooter('Can not be larger then 25')
          for (var j = 0; j < globalPlsWork.length; j++) {
            embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
          }
          message.channel.send({ embed });
        });
      } else if (Number.isInteger(arg)) {
        topx(message, arg, "total", () => {
          embed.setColor(0xFEF65B)
          for (var j = 0; j < globalPlsWork.length; j++) {
            embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
          }
          message.channel.send({ embed });
        });
      } else {
        message.channel.send('usage: d!top [number] No higher then 25')
      }
    }

    if (command === 'serious') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('Serious chat opt in WARNING')
        .setDescription(bot.text.serious);
      message.channel.send({ embed });
      con.query(`UPDATE userpoints SET serious = 1 WHERE userid = ${message.author.id}`);
      function function2() {
        con.query(`SELECT serious from userpoints WHERE userid = ${message.author.id}`, (err, result) => {
          if (result[0].serious === 1) {
            con.query(`UPDATE userpoints SET serious = 0 WHERE userid = ${message.author.id}`);
            message.channel.send('Timed out');
          }
        });
      }
      setTimeout(function2, 60000);
    }

    if (command === 'yes') {
      con.query(`SELECT serious from userpoints WHERE userid = ${message.author.id}`, (err, result) => {
        if (result[0].serious === 1) {
          role('add', message, bot.role.serid);
          message.channel.send('You now have access');
          con.query(`UPDATE userpoints SET serious = 2 WHERE userid = ${message.author.id}`);
        } else {
          message.channel.send('Use d!serious first');
        }
      });
    }

    if (command === 'no') {
      con.query(`SELECT serious from userpoints WHERE userid = ${message.author.id}`, (err, result) => {
        if (result[0].serious === 1) {
          con.query(`UPDATE userpoints SET serious = 0 WHERE userid = ${message.author.id}`);
          message.channel.send('Got it');
        } else {
          message.channel.send('Use d!serious first');
        }
      });
    }

    if (command === 'flip') {
      con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
      if (message.content.toLowerCase().match('@')) {
        if (message.content.toLowerCase().match('<')) {
          if (message.content.toLowerCase().match('394424134337167360')) {
            message.channel.send("Oh you think thats funny do you? How's about this!");
            message.channel.send(upsidedown(`${message.author.tag.slice(0, -5)} ︵╯）°□°╯)`));
          } else {
            message.channel.send(upsidedown(`${message.cleanContent.slice(8)} ︵╯）°□°╯)`));
          }
        } else {
          message.channel.send('How to use: `d!flip @user');
        }
      } else {
        message.channel.send('How to use: `d!flip @user`');
      }
    }

    if (command === 'mcserver') {
      extIP((err, ip) => {
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('Community minecraft server running 1.13')
          .setDescription(`The IP: -----> ${ip}`)
          .setFooter('The IP will change over time, if you have connection inssues in the future, check back to see if a new IP has been given!');
        message.channel.send({ embed });
      });
    }

    if (command === 'givememodrole') {
      if (message.author.id === '292007279228747788') {
        role('add', message, bot.role.modsid);
      } else {
        message.channel.send('nice try');
      }
    }

    if (command === 'time') {
      function time() {
        if (args[0] === 'set') {
          var zone = args[1];
          var zoneUp = zone.charAt(0).toUpperCase() + zone.slice(1);
          let zoneconver = 'not a timezone';
          for (var i = 0; i < moment.tz.names().length; i++) {
            if (moment.tz.names()[i].match(zoneUp)) {
              zoneconver = moment.tz.names()[i]
            }
          }
          setTimeout(() => {
            if (zoneconver === 'not a timezone') {
              message.channel.send('The timezone or location you provided we could not find in our database, please try again')
            } else {
              con.query(`UPDATE members SET timeOrLoc = ? WHERE userid = ${message.author.id}`, [zoneconver]);
              message.channel.send(zoneconver + ' is now set as your time or location')
            }
          }, 1000);
        } else {
          if (args[0] != null) {
            con.query(`SELECT timeOrLoc FROM members WHERE userid = "${message.content.replace(/\D/g, '')}"`, (err, result) => {
              if (typeof result[0] != 'undefined') {
                if (message.content.replace(/\D/g, '') === '') {
                  message.channel.send('For help type d!timehelp')
                } else if (result[0].timeOrLoc === '') {
                  message.channel.send('Look like they may have not set a time yet')
                } else {
                  if (result[0].timeOrLoc.length > 2) {
                    message.channel.send('In ' + result[0].timeOrLoc + ', the local time is ' + moment.tz(Date.now(), result[0].timeOrLoc).format('hh:mmA z'))
                  } else {
                    message.channel.send('For help type d!timehelp')
                  }
                }
              } else {
                memberData(message.author.id)
                setTimeout(() => {
                  time()
                }, 500)
              }
            })
          } else {
            message.channel.send('For help type d!timehelp')
          }
        }
      }
      time()
    }

    if (message.content.match('!ver')) {
      if (__dirname.match('STABLE')) {
        const embed = new MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('doddlebot info')
          .setDescription(`The IP: -----> ${ip}`)
          .setFooter('The IP will change over time, if you have connection inssues in the future, check back to see if a new IP has been given!');
        message.channel.send({ embed });
      } else {
        // const embed = new MessageEmbed()
        function format(seconds) {
          function pad(s) {
            return (s < 10 ? '0' : '') + s;
          }
          const hours = Math.floor(seconds / (60 * 60));
          const minutes = Math.floor(seconds % (60 * 60) / 60);
          var seconds = Math.floor(seconds % 60);
  
          return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
        const stats = fs.statSync("./index.js")
        const fileSizeInBytes = stats.size
        const fileSizeInMegabytes = fileSizeInBytes / 1000.0
        const uptime = process.uptime();
        con.query(`SELECT count FROM commandusage WHERE id = 19`, (err, result) => {
          embedContent = [
            { name: "Build", value: '**INDEV**\n' + 'Version: ' + bot.system.ver + '\n' + 'Build: ' + result[0].count, inline: true},
            { name: "Extras", value: 'Up time: ' + format(uptime) + '\nSize: ' + fileSizeInMegabytes + ' KB' , inline: true},
          ]
          message.channel.send( {
            embed: {
              color: 0xFEF65B,
              title: "doddlebot info",
              fields: embedContent,
            }
          });
        });
      }
    }

    if (command === 'test') {
      const doc = new PDFDocument();

      function archiveData(callback) {

        //////////////////////
        /// YearArrayBlock ///
        /////////////////////
        const getYear = new Date().getFullYear() //Get the currant year
        var yearData = []  //
        var points = []    // 
        var wordCount = [] // this is passed tought as a callback
        var channel = []   //
        var channelCounts = {}    //
        var sortable = [];
        for (let y = 2018; y < getYear +1; y++) { // checks the year (started colleding data in 2018)
          con.query(`SELECT * FROM archive WHERE userid = 470033984575897600`, (err, result) => { // SQL shit
            var yearlyData = [] // this is the data that had been put into yearly order
            var pointsData = 0
            var wordData = 0
            var channelData = []
            for (let i = 0; i < result.length; i++) { // checkes the length of the SQL result
              const argsDate = `${result[i].date}`.trim().split(/ +/g); // Grabs the date of each result 
              if (argsDate[3] === `${y}`) { // if the year of the message is with in the year of the first for loop then is added to the yearlyData arry
                yearlyData.push(result[i]) // pushed to array
                pointsData += result[i].pointsgained // adding the points
                wordData += result[i].messagecount
                channelData.push(result[i].channel)
              }
            }
            yearData.push(yearlyData) // each year is then pushed to the yearData arry, this also makes this function atoumectly expandble. nothing to do when the new year comes!
            points.push(pointsData)
            wordCount.push(wordData)
            channel.push(channelData) 
            setTimeout(() => {
              channel[0].forEach(function(x) { channelCounts[x] = (channelCounts[x] || 0)+1; });
            }, 1000)
            setTimeout(() => {
              // var sortable = [];
              for (var count in channelCounts) {
                  sortable.push([count, channelCounts[count]]);
              }
              sortable.sort(function(a, b) {
                return b[1] - a[1];
              });
            }, 1000)
          });
        }
        setTimeout(() => {
          callback(yearData, points, wordCount, sortable)
          console.log(yearData, points, wordCount, channelCounts, sortable)
        }, 3000)
      }
      
      // start PDPkit
      doc.pipe(fs.createWriteStream(`./tmp/${message.author.id} ${message.author.tag}.pdf`));
      doc.image('./imgs/hiresdoddlecord.PNG', {
        fit: [475, 200],
        align: 'center',
      });
      doc.font('./fonts/Roboto-Thin.ttf')
        .fontSize(11);
      doc.text(`\nYour data ${message.author.tag}`, { align: 'center' });
      const joinDateArray = `${message.guild.members.get(message.author.id).joinedAt}`.trim().split(/ +/g);
      doc.text(`\nYou joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}` || '\nYou joined on: No data', { align: 'center' });
      doc.text(bot.text.gdpr);
      archiveData((yearData, points, wordCount, channel) => {
        // console.log(channel)
        let mark = false
        for (let i = 0; i < yearData.length; i++) {
          const argsDate = `${yearData[i][i].date}`.trim().split(/ +/g);
          var year = argsDate[3]
          doc.addPage() // second page
          doc.fontSize(80)
          doc.text(year, { align: 'center' })
          doc.fontSize(20)
          doc.text('Stats\n', { align: 'center' });
          doc.fontSize(11)
          // points
          if (year > 2018) {
            doc.text('Points gained in the year: ' + points[i] || 'No data', { align: 'center' })
          } else {
            doc.text('Points may have no data, this is normal for 2018', { align: 'center' })
          }
          // total message sent
          doc.text(`Messages sent: ` + yearData[i].length, { align: 'center' })
          // wordcount
          doc.text('Word Count: ' + wordCount[0], { align: 'center' })
          // top3 channles
          doc.text('\nChannle usage', { align: 'left' })
          for (let z = 0; z < channel.length; z++) {
            doc.text(`      #${z + 1}: ${channel[z][0]} with ${channel[z][1]} messages`, { align: 'left' })
          }
          // biggist message
          for (let messageData = 0; messageData < yearData[i].length; messageData++) {
            const argsDateM = `${yearData[i][messageData].date}`.trim().split(/ +/g);
            function month() {
              doc.addPage().fontSize(40).text(bot.months[argsDateM[1]]);
              // doc.fontSize(40).text(bot.months[argsDateM[1]]);
              doc.fontSize(10);
            }
            function day() {
              doc.fontSize(20).moveDown().text(`${argsDateM[0]}, ${argsDateM[2]}`);
              doc.fontSize(10);
            }
            if (mark === false) {
              mark = true
              month()
              day()
            }
            if (messageData > 0) {
              const argsDateBefor = `${yearData[i][messageData -1].date}`.trim().split(/ +/g);
              if (argsDateM[1] != argsDateBefor[1]) {
                month()
              }
              if (argsDateM[0] != argsDateBefor[0]) {
                day()
              }
            }
            doc.text(`    ${argsDateM[4] || 'No data'} Message #${yearData[i][messageData].id || 'No data'} In channel: ${yearData[i][messageData].channel || 'No data'} Word count #${yearData[i][messageData].messagecount || 'No data(Img)'} Points: ${yearData[i][messageData].pointsgained || "No data"}`);
          }
        }
      })
      /* archiveData((yearData) => {
       // console.log(yearData[0][0].date)
        for (let i = 0; i < yearData[0].length; i++) {
          const argsDate = `${archive[i].date}`.trim().split(/ +/g);
          var year = argsDate[3]
          if (i === 0) {
            doc.fontSize(80);
            doc.text(year, { align: 'center' });
            doc.fontSize(11);
            doc.moveDown();
            doc.text(`your stats for ${year}\n`, { align: 'center' });
            // doc.text('Word count for the year ' + countY + '      Message count ', { align: 'center' });
            doc.addPage();
            doc.fontSize(40);
            doc.text(bot.months[argsDate[1]]);
            doc.fontSize(11);
            doc.fontSize(20);
            doc.moveDown();
            doc.text(`${argsDate[0]}, ${argsDate[2]}`);
            doc.fontSize(11);
          } 
          if (i > 0) {
            const argsDateBefor = `${archive[i -1].date}`.trim().split(/ +/g);
            var yearBefor = argsDateBefor[3]
            if (year != yearBefor) {
              doc.addPage();
              doc.fontSize(80);
              doc.text(year, { align: 'center' });
              doc.fontSize(11);
              doc.moveDown();
              doc.text(`your stats for ${year}`, { align: 'center' });
              doc.addPage();
            }
            if (argsDate[1] != argsDateBefor[1]) {
              doc.addPage();
              doc.fontSize(40);
              doc.text(bot.months[argsDate[1]]);
              doc.fontSize(11);
            }
            if (argsDate[0] != argsDateBefor[0]) {
              doc.fontSize(20);
              doc.moveDown();
              doc.text(`${argsDate[0]}, ${argsDate[2]}`);
              doc.fontSize(11);
            }
          }
          // const args = archive[i].date.trim().split(/ +/g);
          doc.text(`    ${argsDate[4]} You sent message #${archive[i].id} In channel: ${archive[i].channel} Word count #${archive[i].messagecount}`);
        }
      }) */
      setTimeout(() => {
        doc.end();
      }, 5000)
    }

  }
});
