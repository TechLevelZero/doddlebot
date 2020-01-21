/* eslint no-implicit-globals: "error", consistent-return: 0, no-console: 0 */

// doddlebot 1.3 WiP author: Ben Hunter

const { Client, MessageEmbed } = require('discord.js');
const crypto = require('crypto');
const config = require('./json_files/config.json');
const bot = require('./json_files/data.json');
const mysql = require('mysql');
const { execFile } = require('child_process')//.spawn;
const upsidedown = require('upsidedown');
var moment = require('moment-timezone');
// const compare = require('js-levenshtein'); to be used for intro comparions
const extIP = require('external-ip')();
const fs = require('fs');
const CronJob = require('cron').CronJob

var justJoined = false

console.log(Client)

let globalPlsWork;

// SQL config
const dbConfig = {
  host: 'localhost',
  user: 'doddlebot',
  password: config.dbpass,
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
  con.connect(err => {
    if (err) {
      console.log('error when connecting to db:', err);
      console.log('DATABASE = doddlebot');
      setTimeout(handleDisconnect, 2000);
    }
  });
  con.on('error', err => {
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
  var queery = ''; // geddit? It's because we're all gay.
  var title = '';

  // Gets mods and managers
  var modIds = message.guild.roles.get('376873845333950477').members.map(m => {return m.id});
  var managersIDs = message.guild.roles.get('337016459429412865').members.map(m => {return m.id});
  var toRequest = (modIds.length + managersIDs.length) + Number(x);

  if (mode == 'total') {
    queery = `SELECT userid, nickname, level, points, totalpoints FROM member_data ORDER BY totalpoints DESC LIMIT ${toRequest}`;
    title = `doddlecord's top ${x} of all time`;
  } else if (mode == 'weekly') {
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
    console.log('Sorted (Excluding mods) limited to x length', topxArray);
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
 * - games
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
function memberData(userID, displayName, roles) {
  const memberIDAray = [
    [`${userID}`, `${displayName}`, 1, `${roles}`],
  ];
  con.query('INSERT INTO member_data (`userid`, `nickname`, `level`, `roles`) VALUES ?', [memberIDAray], err => {
    if (err) {
      console.log(err)
      client.channels.get('400762131252772866').send(`There was an error with ${displayName}'s (${userID}) data, doddlebot has recoved but the DB table may need checking`)
    }
    console.log('New Member Data Added To The Table'); });
}

/**
 * loggerSQL function
 * @param  {string} type - Types of logssql
 * - system
 * - info
 * - error
 * @param  {object} member - Members's discord collection
 * @param  {string} data - Text data you want to log
 */
function logger(type, member, data) {
  var post  = {'type': type, 'userid': member.id, 'message':data};
  var query = con.query('INSERT INTO logger SET ?', post, function (error, results, fields) {
    if (error) throw error;
    // Neat!
  });
  // console.log(query.sql);
}

function discordMD(message) {
  const user = message.author.id
  message.client.guilds.get('337013993669656586').members.fetch({ user, cache: false }).then(memberData => {
    var memberDataString = JSON.stringify(memberData)
    var memberArray = JSON.parse(memberDataString)
    return memberArray
  })
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
client.on('error', e => {return console.error(e)});
client.on('warn', e => {return console.warn(e)});
// client.on('debug', e => console.info(e));
client.on('debug', e => {
  if (e.match('latency')) {
    var str = '';
    var currentTime = new Date()
    var days = currentTime.getDay()
    var months = currentTime.getMonth()
    var years = currentTime.getFullYear()
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()
    str += (' ' + hours + ':' + minutes + ':' + seconds + '   ' + days + '/' + months + '/' + years);
    console.log('Core: ' + e + str)
  }
});

// Loads logs and sets activity
client.on('ready', () => {
  console.log(client.guilds.get('337013993669656586').members.filter(m => {return m.presence.status === 'online'}).size);
  con.query('UPDATE commandusage SET count = count + 1 WHERE command = "build"');
  client.user.setActivity('With doddleolphin', { type: 'PLAYING' });
  console.log(`Logged in as ${client.user.username} ${bot.system.ver}`);
  con.query('SELECT type, time, message FROM logger WHERE type = "system" ORDER BY time ASC', (err, result) => {
    if (err) throw err;
    var x;
    for (x in result) {
      // console.log(`${result[x].type}: @${result[x].time}, ${result[x].message}`);
    }
    console.log('ARCHIVE LOADED');
  });
  const job = new CronJob('0 12 * * 0', function() {
    const serverChannels = client.guilds.get('337013993669656586').channels;
    const Channel = serverChannels.get(bot.channels.general);
    Channel.messages.fetch(Channel.lastMessageID).then(message => {
      client.guilds.get('337013993669656586').members.prune({
        days: 7, reason: 'members have not introduced them selfs within and have been offline for 7 days'
      }).then(prune => {
        logger('system', client.user, `This week, ${prune} members have been removed`);
        serverChannels.get(bot.channels.testfacility).send(`this week, ${prune} members have been removed`)
      })

      topx(message, 5, 'weekly', () => {
        const embed = new MessageEmbed()
        embed.setColor(0xFEF65B)
        embed.setTitle('doddlecord\'s Top 5 of this week')
        for (var j = 0; j < globalPlsWork.length; j++) {
          embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
        }
        const top5remove = message.guild.roles.get(bot.role.top5).members.map(m=>{return m.user});
        setTimeout(() => {
          for (var k = 0; k < top5remove.length; k++) {
            message.guild.members.get(top5remove[k].id).roles['remove'](bot.role.top5);
          }
          console.log(top5remove + 'the 5 removed')
        }, 1000);
        // serverChannels.get(bot.channels.themods).send({ embed });
        // serverChannels.get(bot.channels.themods).send('everyone, does this look ok? Is it sunday? If everything is ok, use d!send to publish')
      });
    })
  });
  if (__dirname.match('STABLE')) {
    job.start();
  }
});

// New memeber procedure
// Discord login, looks to see if in DEV or STABLE branch
client.on('guildMemberAdd', (member) => {
  justJoined == true
  if (__dirname.match('STABLE')) {
    const message = member
    function roleAM2(AOR, message, role) {
      message.guild.members.get(message.id).roles[AOR](role);
    }
    function welcomeEmbed() {
      channel('introduceyourself').send(`${member.guild.members.get(member.id)}`);
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Welcome to doddlecord!**')
        .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
        .setDescription(bot.text.welcomemsg);
      channel('introduceyourself').send(embed)
    }

    console.log(`${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
    logger('info' , member, `${member.user.tag} has joined ${member.guild.name}`);

    var memberDataJSON = JSON.stringify(member)
    var memberArray = JSON.parse(memberDataJSON)
    // console.log(`${memberArray.userID}`, `${memberArray.displayName}`, `${memberArray.roles}`);
    con.query(`SELECT * FROM member_data WHERE userid = ${member.id}`, (err, result) => {
      if (typeof result[0] != 'undefined') {
        if (result[0].score > 1000) {
          channel('introduceyourself').send(`Hey ${member.guild.members.get(member.id)} welcome back! Looks like you where a member`);
          roleAM2('add', member, bot.role.memberid);
        } else {
          // memberData(memberArray.userID, memberArray.displayName, memberArray.roles);
          welcomeEmbed()
        }
      } else {
        // memberData(memberArray.userID, memberArray.displayName, memberArray.roles);
        welcomeEmbed()
      }
    });
  }
});

client.on('guildMemberRemove', remember => {
  con.query(`DELETE FROM member_data WHERE userid = ${remember.id}`)
  con.query(`DELETE FROM weeklypoints WHERE userid = ${remember.id}`)
  console.log(`${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`, '\nMemberData Has Been removed');
  logger('info' , remember, `${remember.user.tag} Has left ${remember.guild.name}`);
  channel('general').send(`${remember.user.tag.slice(0, -5)} has left, can we get some Fs in chat please`)
});


let perscommandList = [];

let key = Object.keys(bot.newRoles)

for (key in bot.newRoles) {
  if (!key.includes('/')) {
    perscommandList.push(key);
  }
}
perscommandList = perscommandList.join('\n');

client.on('message', message => {
  // This checks if the member had data on the db if not it will insert a new row with the members data
  var memberPromise = new Promise(function(resolve, reject) {
    con.query(`SELECT * FROM member_data WHERE userid = ${message.author.id}`, (err4, dbData) => {
      if (justJoined === true) return;
      if(dbData[0] === undefined) {
        const user = message.author.id
        message.client.guilds.get('337013993669656586').members.fetch({ user, cache: false }).then(memberDataDB => {
          var memberDataString = JSON.stringify(memberDataDB)
          var memberArray = JSON.parse(memberDataString)
          memberData(message.author.id, memberArray.displayName, memberArray.roles)
          setTimeout(() => { resolve(true) }, 100);
        })
      } else {
        resolve(true)
      }
    })
  });

  memberPromise.then(function(value) {

    con.query(`SELECT * FROM member_data WHERE userid = ${message.author.id}`, (err4, dbData) => {
      const args = message.content.toLowerCase().slice(config.prefix.length).trim().split(/ +/g);
      const command = args.shift().toLowerCase();
      message.content = message.content.toLowerCase();
      if (message.content === 'd!kill') {
        if (message.member.roles.has(bot.role.managersjoshesid) || (message.author.id === '394424134337167360')) {
          logger('system' , message.author, `${message.author.tag} Had shutdown doddlebot')`);
          process.exit();
        }
      }

      if (dbData[0].nickname === undefined) return message.channel.send('An error with you member data has occurred')
      if (message.author.bot) return;

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

      if (message.channel.type === 'dm') {
        if (command === 'data') {
          if ( parseInt(dbData[0].dataepoch) < (Date.now() - 6.048e+8)) {
            con.query(`UPDATE member_data SET dataepoch = '${Date.now()}' WHERE userid = ${message.author.id}`);
            const joinDateArray = `${message.client.guilds.get('337013993669656586').members.get(message.author.id).joinedAt}`.trim().split(/ +/g);
            const joinDateText = `\nYou_joined_on_${joinDateArray[0]}_${joinDateArray[1]}_${joinDateArray[2]}_${joinDateArray[3]}_at_${joinDateArray[4]}`
            logger('info', message.author, 'had requested their data')
            const dateOfPDF = new Date(parseInt(dbData[0].dataepoch))
            const nextDate = new Date(parseInt(dbData[0].dataepoch) + 6.048e+8); // The 0 there is the key, which sets the date to the epoch
            message.channel.send('Getting your data...')
            setTimeout(() => {
              message.channel.send(' You can only do this once a week, The next time you can request your PDF is after ' + nextDate.toUTCString())
            }, 1500)
            console.log(args[0])
            var cp = execFile('node', ['data', message.author.id, message.author.tag, joinDateText, args[0]], {cwd:'./tools/'}, (error, stdout, stderr) => {
              if (error) {
                throw error;
              }
              console.log(stdout);
            });
            setTimeout(() => {
              message.channel.send('Your Data:', {
                files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
              });
              message.channel.send('If you think anything is wrong with your PDF please don\'t hesitate to DM TechLevelZero')
            }, 25000)
          } else {
            const dateOfPDF = new Date(parseInt(dbData[0].dataepoch))
            const nextDate = new Date(parseInt(dbData[0].dataepoch) + 6.048e+8); // The 0 there is the key, which sets the date to the epoch
            message.channel.send('You have alrady requested your data this past week. The next time you can request your data is after ' + nextDate.toUTCString())
            message.channel.send(`Here is your PDF from ${dateOfPDF.toUTCString()}`, {
              files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
            });
          }
        }
        // needs removeing
        if (message.content.match('d!passcode')) {
          if (dbData[0].passcode === '0') {
            if (args[0].length === 4) {
              const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
              con.query(`UPDATE member_data SET passcode = '${contentHashed}' WHERE userid = ${message.author.id}`);
              message.channel.send(`Passcode has been set to '||${args[0]}||' **Its strongey recomened you delete your passcode message** (this message will self destruct)`).then(msg => {
                setTimeout(() => { msg.delete(1) }, 15000)
              })
            } else { message.channel.send('The passcode can only be 4 digits long') }
          } else {
            const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
            if (contentHashed === dbData[0].passcode) {
              if(args[1] && args[0] === undefined) { message.channel.send('`d!passcode [old passcode] [new passcode]`') } else {
                if (args[1].length === 4) {
                  const contentHashedUpdated = crypto.createHmac('sha256', config.key).update(args[1]).digest('hex');
                  con.query(`UPDATE member_data SET passcode = '${contentHashedUpdated}' WHERE userid = ${message.author.id}`);
                  message.channel.send(`Passcode has been updated to ||'${args[1]}'|| **Its strongey recomened you delete your passcode message** (this message will self destruct)`).then(msg => {
                    setTimeout(() => { msg.delete(1) }, 15000)
                  })
                } else { message.channel.send('The passcode can only be 4 digits long') }
              }
            } else { message.channel.send('passcode does not match') } // fight me,  like this style
          }
        }
        //////////////////
      } else {
        const pointsRandom = (Math.floor(Math.random() * 18) + 5);
        if (message.content.length > 13) {
          con.query(`SELECT * FROM member_data WHERE userid = ${message.author.id}`, (err, result) => {
            if (result.length > 0) {
              // ARRAY THIS
              con.query(`UPDATE member_data SET points = points + ${pointsRandom} WHERE userid = ${message.author.id}`);
              con.query(`UPDATE member_data SET totalpoints = totalpoints + ${pointsRandom} WHERE userid = ${message.author.id}`);
              if (result[0].level * 100 < result[0].points) {
                con.query(`UPDATE member_data SET points = 0 WHERE userid = ${message.author.id}`);
                con.query(`SELECT totalpoints FROM member_data WHERE userid = ${message.author.id}`, (err4, totalPointsResult) => {
                  console.log(totalPointsResult)
                  console.log(totalPointsResult[0])
                  console.log(totalPointsResult[0].totalpoints)
                  const resultJsonObjTotalPoints = JSON.stringify(totalPointsResult);
                  const totalPointsSlice = resultJsonObjTotalPoints.slice(16, -4);
                  const totalpoints = totalPointsSlice.concat('00');
                  con.query(`UPDATE member_data SET totalpoints = ${totalpoints} WHERE userid = ${message.author.id}`);
                  setTimeout(() => {
                    con.query(`SELECT userid, nickname FROM member_data WHERE userid = ${message.author.id}`, (err, result) => {
                      if (result[0].nickname != message.member.displayName) {
                        con.query(`UPDATE member_data SET nickname = ? WHERE userid = ${message.author.id}`, [message.member.displayName]);
                      }
                    });
                    con.query(`SELECT userid, name FROM archive WHERE userid = ${message.author.id}`, (err, result) => {
                      if (result[0].username != message.member.displayName) {
                        con.query(`UPDATE archive SET name = ? WHERE userid = ${message.author.id}`, [message.member.displayName]);
                      }
                    });
                    var modIds = message.guild.roles.get('376873845333950477').members.map(m => {return m.id});
                    var managersIDs = message.guild.roles.get('337016459429412865').members.map(m => {return m.id});
                    if (!(modIds.includes(message.author.id))) {
                      if (!(managersIDs.includes(message.author.id))) {
                        con.query(`SELECT userid, username FROM weeklypoints WHERE userid = ${message.author.id}`, (err, result) => {
                          if (result[0].username != message.member.displayName) {
                            con.query(`UPDATE member_data SET nickname = ? WHERE userid = ${message.author.id}`, [message.member.displayName]);
                          }
                        });
                      }
                    }
                  }, 500);
                })
                con.query(`UPDATE member_data SET level = level + 1 WHERE userid = ${message.author.id}`);
                console.log(`${message.author} Levelled up`);
                logger('info' , message.author, `${message.author.tag} has leveled up`);
                if (message.channel.id !== bot.channels.serious) {
                  con.query(`SELECT * FROM member_data WHERE userid = ${message.author.id}`, (err4, pointsResult) => {
                    message.channel.send(`You are now level ${pointsResult[0].level}, ${message.author}`);
                  });
                }
              }
            }
          });
        }

        // Adds server metadata to the table, server stats can be shown with this data
        const messageContent = [
          [`${message.author.id}`, `${message.member.displayName}`, `${message.channel.name}`, `${count}`, `${pointsRandom}`],
        ];
        con.query('INSERT INTO archive (`userid`, `name`, `channel`, `messagecount`, `pointsgained`) VALUES ?', [messageContent], err3 => {
          if (err3) throw err3;
          console.log('Message Metadata Archived', message.channel.id !== bot.channels.serious);
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
                [`${message.author.id}`, `${message.member.displayName}`, 1, 0, 0],
              ];
              con.query('INSERT INTO weeklypoints (`userid`,`username`, `level`, `points`, `totalpoints`) VALUES ?', [newUser], err3 => {
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
            const cont = message.cleanContent.toLowerCase();
            con.query(`SELECT * FROM member_data WHERE userid = ${message.author.id}`, (err2, result) => {
              if (result.length > 0) {
                for (var word in bot.lookup) {
                  if (cont.indexOf(word) != -1) {
                    if (bot.lookup[word] < 0) {
                      console.log(bot.lookup[word]*-1)
                      con.query('UPDATE member_data SET score = score - ' + (bot.lookup[word]*-1) + ' WHERE userid = ' + message.author.id);
                    } else {
                      console.log(bot.lookup[word]*-1 + ' in else')
                      con.query('UPDATE member_data SET score = score + ' + bot.lookup[word] + ' WHERE userid = ' + message.author.id);
                    }
                  }
                }
                if (result[0].score !== -3000000) {
                  if (count > 14) {
                    con.query(`UPDATE member_data SET score = score * 3 WHERE userid = ${message.author.id}`);
                  }
                  con.query(`UPDATE member_data SET score = score + ${count} WHERE userid = ${message.author.id}`);
                  con.query(`UPDATE member_data SET score = score / 4 WHERE userid = ${message.author.id}`);
                  con.query(`SELECT score FROM member_data WHERE userid = ${message.author.id}`, (err, result) => {
                    if (result[0].score >= 1000) {
                      // Automatically adding
                      const addedRoles = [];
                      for (const roleMeme in bot.newRoles) {
                        if (cont.indexOf(roleMeme) !== -1) {
                          role('add', message, bot.role[roleMeme.replace('/','')+'id'])
                          addedRoles.push(roleMeme);
                        }
                      }
                      if (addedRoles.length > 0) {
                        message.channel.send(`Added ${addedRoles.join(', ')} role(s) since it looks like you want them.`);
                      }
                      console.log('final score over 1000')
                      const contentHashed = crypto.createHmac('sha512', config.key).update(cont).digest('hex');
                      con.query('SELECT hash FROM member_data', (err, result19) => {
                        const resultJson1 = JSON.stringify(result19);
                        if (resultJson1.match(contentHashed)) {
                          con.query(`UPDATE member_data SET score = - 3000000 WHERE userid = ${message.author.id}`);
                          channel('themods').send(`${message.author.tag} copied a intro word for word, keep an eye on them!`);
                        } else {
                          con.query(`UPDATE member_data SET hash = '${contentHashed}' WHERE userid = ${message.author.id}`);
                          // con.query(`UPDATE member_data SET wasmember = 1 WHERE userid = ${message.author.id}`);
                          role('add', message, bot.role.memberid);
                          logger('info' , message.author, `${message.author.tag} had been added by doddlebot'`);

                          message.channel.send('Your intro was so good I was able to tell!, I have added you as a member. Welcome to doddlecord! Score: ' + result[0].score);
                          console.log(`${message.author.tag} has been added by doddlebot`);
                        }
                      });
                    }
                  });
                }
              }
            });
          }
          con.query('SELECT count FROM commandusage WHERE id = 21', (err, result) => {
            if (result[0].count === 0) return;
            autoMember();
          })
        }

        // update nickname in table
        con.query(`SELECT nickname FROM member_data WHERE userid = ${message.author.id}`, (err, result) => {
          const displayName = message.client.guilds.get('337013993669656586').members.get(message.author.id).displayName
          if (result[0].nickname != displayName) {
            const newName = [
              [`${displayName}`],
            ];
            con.query(`UPDATE member_data SET nickname = ? WHERE userid = ${message.author.id}`, [newName], err3 => {
              if (err3) throw err3;
              console.log('User nickname updated');
            });
          }
        })

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
              if (message.member.roles.has(bot.role[colours[i].concat('id')])) {
                message.reply(`you have already have ${colours[i]}`);
              } else {
                removeColours();
                role('add', message, bot.role[colours[i].concat('id')]);
                message.reply(`you now have the ${colours[i]} colour!`);
              }
            } else if (colour === 'remove') {
              mark = 'remove';
            }
          }
          // r/OutOfTheLoop
          if (mark === 'remove') {
            removeColours();
            message.reply('you have removed your colour');
          }
        }
        // End of colour stuff

        // personality stuff
        if (command === 'roles') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          if (message.member.roles.has(bot.role.memberid)) {
            const per0 = args[0];
            const per1 = args[1];
            const peradded1 = [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]];
            const embed = new MessageEmbed();
            const changed = [];
            let state = 'NA';
            embed.setColor(0xFEF65B);
            if (per0 === 'remove') {
              embed.setTitle('Roles removed:');
              state = 'removed';
            } else {
              embed.setTitle('Roles added:');
              state = 'added';
              peradded1.unshift('added');
            }
            if (per1 === 'all') {
              if (per0 === 'remove') {
                const toRemove = ['gay', 'straight', 'bisexual', 'asexual', 'pansexual', 'female', 'male', 'lesbian', 'non binary', 'fluid', 'agender', 'hehim', 'sheher', 'theythem', 'trans'];
                for (let i = 0; i < toRemove.length; i++) {
                  role('remove', message, bot.role[toRemove[i].concat('id')]);
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
                message.channel.send(`${message.author} example: d!pers gay male memedealer [For help type d!persroles]`);
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

        if (command === 'serverinfo') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setDescription(`**__${message.guild.name} Details__**`)
            .setThumbnail(message.guild.iconURL)
            .addField('Members', `${message.guild.memberCount - message.guild.members.filter(member => {return member.user.bot}).size} Members`)
            .addField('Bots', `${message.guild.members.filter(member => {return member.user.bot}).size} Bots`)
            .addField('Channels', `${message.guild.channels.filter(chan => {return chan.type === 'voice'}).size} voice / ${message.guild.channels.filter(chan => {return chan.type === 'text'}).size - 6} text`)
            .addField('Mods', message.guild.roles.get('376873845333950477').members.map(m => {return m.user}).join(', '))
            .addField('Managers', message.guild.roles.get('337016459429412865').members.map(m => {return m.user}).join(', '));
          message.channel.send({ embed });
        }

        if (command === 'colourhelp') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('**Colour Role Help**')
            .setDescription('This is the command to add colour to your name in doddlecord!')
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

        if (command === 'roleshelp') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('**Personal Role Help**')
            .setDescription('Personal roles are added to give a little info on who you are to other members of doddlecord.\nThey are completely optional roles though. Make __shore__ you spell them correctly or it will not add them!')
            .addField('Use', '```d!roles [remove] Gay Hehim Artist```')
            .addField('**Commands**', (perscommandList));
          message.channel.send({ embed });
        }

        if (command === 'allhelp') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('**All Help**')
            .setDescription('Every command I can do!')
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
            .setDescription('Just some extra commands that doddlebot can do!\n\nCommands with * means the input is requied E.G: `d!top 10`')
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
          console.log(client.ping)
          message.channel.send(`Ping is ${ping}ms`);
          logger('system' , message.author, `Ping was ${ping}ms`);
        }

        if (message.channel.name === 'secrets-for-the-mods') {
          if (command === 'send') {
            topx(message, 5, 'weekly', () => {
              const embed = new MessageEmbed()
              embed.setColor(0xFEF65B)
              embed.setTitle('doddlecord\'s Top 5 of this week')
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
            channel('announcements').send('@everyone');
            const embed = new MessageEmbed()
              .setColor(0xFEF65B)
              .setTitle('doddlebot 1.3 The update (its finally done)')
              .setDescription('1.3 is finally out and with it brings alot of new features you may have alrady used!\n\nHere is a list of the new ones!\n\n**Member Profiles**\nWith profiles you can see: Rank, Member stats, Roles, and More\n`Usage: d!profile to get your profile or @[member] to get there profile`\n\n**Time**\n`d!timehelp` to get more info.\n\n**RewindPDF**\n(You need to allow DMs from doddlebot) but with this you can get stats about your time on doddlecord in a nice PDF format.\nDM doddlebot `d!data` to get your PDF\n\n**Roles on intro**\nAs you have probably seen doddlebot now gives roles to new members if there intro has certan keywords in it.\n\n**Weekly top 5**\nIt finaly got automated, well kida... but thats for the mods to figure out. Expect the Weekly top 5 every Sunday just after 12pm GMT\n\n**Revoke Serious Access**\nYou can now remove serious chat access at your own will\n\n**Command Changes**\nIn this update some commands have changed. All the help menus have been updated to reflect this!')
              .setFooter('bug fixes\nd!time would get stuck in a loop.     An issue was found with AutoMember2.0 and was turned back on with v2.0.1.     Level up message was sending into serious chat.     male role was not being added when requested.     A members most recent nickname/username was not being used.     RewindPDF was not spawning child process');
            channel('announcements').send(embed);
          }
        }
        // Boo!
        if (command === 'rank') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          if (args[0] != null) {
            con.query(`SELECT * FROM member_data WHERE userid = "${message.content.replace(/\D/g, '')}"`, (err, result) => {
              if (result[0] != null) {
                const embed = new MessageEmbed()
                  .setColor(0xFEF65B)
                  .setTitle(`Rank Of ${result[0].nickname}`)
                  .addField('Level', (result[0].level))
                  .addField('Points', (result[0].points))
                  .addField('There Next Level In', `${(result[0].level * 100) - result[0].points} Points`)
                  .setFooter(`Total points gained: ${result[0].totalpoints}`);
                message.channel.send({ embed });
              } else { message.channel.send('can\'t find any points on this member. `d!rank` for your own rank or `d!rank @user` to get anothers users rank'); }
            });
          } else {
            con.query(`SELECT * FROM member_data WHERE userid = "${message.author.id}"`, (err, result) => {
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

        if (command === 'profile') {
          var roleArray = []

          var wordCount = 0
          var popChannel = []
          let mf = 1;
          let m = 0;
          let item;

          function arrayRole(roles) {
            for (var x = 0; x < roles.length; x++) {
              if ((x + 1) != (roles.length - 1)) {
                roleArray.push('<@&' + roles[x] + '>, ')
              } else {
                roleArray.push('<@&' + roles[x] + '>')
              }
            }
            roleArray.pop()
          }
          function count(result) {
            for (let i = 0; i < result.length; i++) { // checkes the length of the SQL result
              wordCount += result[i].messagecount // adding the points
              popChannel.push(result[i].channel)
            }
            for (let i=0; i<popChannel.length; i++)
            {
              for (let j=i; j<popChannel.length; j++)
              {
                if (popChannel[i] == popChannel[j])
                  m++;
                if (mf<m)
                {
                  mf=m;
                  item = popChannel[i];
                }
              }
              m=0;
            }
          }

          if (args[0] != null) {
            if (message.mentions.users.first() === undefined) return message.channel.send('That is not a member, usages: `d!profile [@member]`');
            var mentionedUser = message.mentions.users.first();
            con.query(`SELECT * FROM member_data WHERE userid = "${mentionedUser.id}"`, (err, result) => {
              con.query(`SELECT * FROM archive  WHERE userid = '${mentionedUser.id}'`, (err, archive) => {
                var timez = (result[0].timeOrLoc || 'Member has not set it yet');
                var mentioned = (message.client.guilds.get('337013993669656586').members.get(mentionedUser.id))
                const embed = new MessageEmbed()
                  .setColor(mentioned.displayHexColor)
                  .setTitle(`${mentioned.displayName}'s Profile`, true)
                  .setThumbnail(mentionedUser.displayAvatarURL())
                  .setDescription('Loading...')
                message.channel.send({ embed }).then(msg => {
                  count(archive)
                  arrayRole(mentioned.roles.map(role => {return role.id}))

                  const joinDateArray = `${message.client.guilds.get('337013993669656586').members.get(message.mentions.users.first().id).joinedAt}`.trim().split(/ +/g);
                  const embed = new MessageEmbed()
                    .setColor(mentioned.displayHexColor)
                    .setTitle(`${mentioned.displayName}'s Profile`, true)
                    .setThumbnail(mentionedUser.displayAvatarURL())
                    .addField('Rank', 'Level: ' + (result[0].level) + '\nPoints: ' + (result[0].points) + '\nNext Level In ' + ((result[0].level * 100) - result[0].points) + ' Points' + `\nTotal points gained: ${result[0].totalpoints}`, true)
                    .addField('Member Stats', `Messages: ${archive.length}\nWord Count: ${wordCount}\nMost used channel: ${item}\nwith ${mf} messages`, true)
                    .addField('Time Zone', timez, true)
                    .addBlankField()
                    .addField('Roles', roleArray.join(''))
                    .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`);
                  message.channel.send({ embed });
                  msg.delete(1)
                })
              })
            })
          } else {
            var timez = (dbData[0].timeOrLoc || 'You have not set a Time or location. Use d!timehelp to get started');
            const embed = new MessageEmbed()
              .setColor(message.member.displayHexColor)
              .setTitle(`Your Profile ${message.member.displayName}`, true)
              .setThumbnail(message.author.displayAvatarURL())
              .setDescription('Loading...')
            message.channel.send({ embed }).then(msg => {
              con.query(`SELECT * FROM archive  WHERE userid = '${message.author.id}'`, (err, result) => {
                count(result)
                arrayRole(message.member.roles.map(role => {return role.id}))
                const joinDateArray = `${message.client.guilds.get('337013993669656586').members.get(message.author.id).joinedAt}`.trim().split(/ +/g);
                const embed = new MessageEmbed()
                  .setColor(message.member.displayHexColor)
                  .setTitle(`Your Profile ${message.member.displayName}`, true)
                  .setThumbnail(message.author.displayAvatarURL())
                  .addField('Rank', 'Level: ' + (dbData[0].level) + '\nPoints: ' + (dbData[0].points) + '\nNext Level In ' + ((dbData[0].level * 100) - dbData[0].points) + ' Points' + `\nTotal points gained: ${dbData[0].totalpoints}`, true)
                  .addField('Member Stats', `Messages: ${result.length}\nWord Count: ${wordCount}\nMost used channel: ${item}\nwith ${mf} messages`, true)
                  .addField('Time Zone', timez)
                  .addBlankField()
                  .addField('Roles', roleArray.join(''))
                  .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`);
                message.channel.send({ embed });
                msg.delete(1)
              })
            })
          }
        }

        if (command === 'top') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          const arg = parseInt(args[0]);
          const embed = new MessageEmbed()
          if (arg > 25) {
            topx(message, 25, 'total', () => {
              embed.setColor(0xFEF65B)
              embed.setFooter('Can not be larger then 25')
              for (var j = 0; j < globalPlsWork.length; j++) {
                embed.addField(`#${j+1}: ${globalPlsWork[j].nickname}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
              }
              message.channel.send({ embed });
            });
          } else if (Number.isInteger(arg)) {
            topx(message, arg, 'total', () => {
              embed.setColor(0xFEF65B)
              for (var j = 0; j < globalPlsWork.length; j++) {
                embed.addField(`#${j+1}: ${globalPlsWork[j].nickname}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
              }
              message.channel.send({ embed });
            });
          } else {
            message.channel.send('usage: d!top [number] No higher then 25')
          }
        }

        if (command === 'serious') {
          const user = message.author.id
          message.client.guilds.get('337013993669656586').members.fetch({ user, cache: false }).then(memberData => {
            var memberDataString = JSON.stringify(memberData)
            var memberArray = JSON.parse(memberDataString)
            if (memberArray.roles.includes(bot.role.serid)) {
              message.channel.send('you already have access, if you want to remove it react with \u2705').then(msg => {
                msg.react('\u2705')
                setTimeout(() => {
                  var oof = setTimeout(() => { clearInterval(reactReact); try { msg.delete(1) } catch (err) { console.log('message already deleted') } /*message.delete(1)*/ }, 15000)
                  var reactReact = setInterval(() => {
                    if (msg.reactions.get('\u2705').users.get(message.author.id) != undefined) {
                      message.reply('Your access has been removed')
                      try { msg.delete(1) } catch (err) { console.log('message already deleted')}
                      role('remove', message, bot.role.serid)
                      clearInterval(reactReact)
                      clearInterval(oof)
                    }
                  }, 400)
                },500)
              });
            } else {
              const embed = new MessageEmbed()
                .setColor(0xFEF65B)
                .setTitle('Serious chat opt in WARNING')
                .setDescription(bot.text.serious);
              message.channel.send({ embed }).then(msg => {
                setTimeout(() => {
                  msg.react('\u2705')
                  setTimeout(() => {
                    var oof = setTimeout(() => { clearInterval(reactReact); try { msg.delete(1) } catch (err) { console.log('message already deleted') } /*message.delete(1)*/ }, 30000)
                    var reactReact = setInterval(() => {
                      if (msg.reactions.get('\u2705').users.get(message.author.id) != undefined) {
                        message.reply('You now have access')
                        try { msg.delete(1) } catch (err) { console.log('message already deleted')}
                        role('add', message, bot.role.serid)
                        clearInterval(reactReact)
                        clearInterval(oof)
                      }
                    }, 400)
                  },500)
                })
              });
            }
          })
        }
        // fuck me this need redoing lol
        if (command === 'flip') {
          con.query(`UPDATE commandusage SET count = count + 1 WHERE command = "${command}"`);
          if (message.content.toLowerCase().match('@')) {
            if (message.content.toLowerCase().match('<')) {
              if (message.content.toLowerCase().match('394424134337167360')) {
                message.channel.send('Oh you think thats funny do you? How\'s about this!');
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
              .setTitle('Community minecraft server running 1.14')
              .setDescription(`Join now: mc.doddlecord.com\n\nlatest IP: -----> ${ip}`)
              .setFooter('If you have connection inssues in the future, use the latest IP address');
            message.channel.send({ embed });
          });
        }

        if (command === 'time') {
          function time() {
            if (args[0] === 'set') {
              var zone = args[1].toUpperCase();
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
                  con.query(`UPDATE member_data SET timeOrLoc = ? WHERE userid = ${message.author.id}`, [zoneconver]);
                  message.channel.send(zoneconver + ' is now set as your time or location')
                }
              }, 1000);
            } else {
              if (args[0] != null) {
                con.query(`SELECT timeOrLoc FROM member_data WHERE userid = "${message.content.replace(/\D/g, '')}"`, (err, result) => {
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
                })
              } else {
                message.channel.send('For help type d!timehelp')
              }
            }
          }
          time()
        }

        if (command === 'hello') {

        }
        if (command === 'test') {
          const serverChannels = client.guilds.get('337013993669656586').channels;
          const Channel = serverChannels.get(bot.channels.general);
          Channel.messages.fetch(Channel.lastMessageID).then(message => {
            client.guilds.get('337013993669656586').members.prune({
              days: 7, reason: 'members have not introduced them selfs within and have been offline for 7 days'
            }).then(prune => {
              logger('system', client.user, `This week, ${prune} members have been removed`);
              serverChannels.get(bot.channels.testfacility).send(`This week, ${prune} members have been pruned`)
            })

            topx(message, 5, 'weekly', () => {
              const embed = new MessageEmbed()
              embed.setColor(0xFEF65B)
              embed.setTitle('doddlecord\'s Top 5 of this week')
              for (var j = 0; j < globalPlsWork.length; j++) {
                embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
                message.guild.members.get(globalPlsWork[j].userid).roles['remove'](bot.role.top5);
              }
              const top5remove = message.guild.roles.get(bot.role.top5).members.map(m=>{return m.user.tag});
              for (var k = 0; k < top5remove.length; k++) {
                console.log('hh')
              }

              role('remove', message, bot.role.top5);
              serverChannels.get(bot.channels.testfacility).send({ embed });
              serverChannels.get(bot.channels.testfacility).send('@everyone, does this look ok? Is it sunday? If everything is ok, use d!send to publish')
            });
          })
        }
      }
    });
  });
});
