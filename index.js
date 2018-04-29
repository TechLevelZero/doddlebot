/* eslint consistent-return: 0, no-console: 0 */

// doddlebot 1.1.7 by Ben Hunter

const Discord = require('discord.js');

const config = require('./config.json');

const role = require('./roles.json');

const browserHis = require('./BrowserHistory.json');

const mysql = require('mysql');

const Cleverbot = require('cleverbot-node');

const upsidedown = require('upsidedown');

const fs = require('fs');

const log4js = require('log4js');

const count = require('word-count');

const clbot = new Cleverbot();

clbot.configure({ botapi: config.cleverbotapikey });

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: config.mysqlpass,
  database: 'doddlecord',
});

log4js.configure({
  appenders: {
    multi: {
      type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log',
    },
  },
  categories: {
    default: { appenders: ['multi'], level: 'info' },
  },
});

const errorLogger = log4js.getLogger('fatal');
const infoLogger = log4js.getLogger('info');
const bugLogger = log4js.getLogger('debug');

const client = new Discord.Client();
// files
const colourcommandList = fs.readFileSync('command lists/colourcommands.txt', 'utf8');
const catcommandList = fs.readFileSync('command lists/catogerycommandlist.txt', 'utf8');
const perscommandList = fs.readFileSync('command lists/perscommandlist.txt', 'utf8');
const othercommandList = fs.readFileSync('command lists/othercommandlist.txt', 'utf8');
const colouruse = fs.readFileSync('txt_files/colouruse.txt', 'utf8');
const welcomemsg = fs.readFileSync('txt_files/welcome message.txt', 'utf8');
const uk = fs.readFileSync('txt_files/uk.txt', 'utf8');
const us = fs.readFileSync('txt_files/us.txt', 'utf8');
const serious = fs.readFileSync('txt_files/serious.txt', 'utf8');
const info = fs.readFileSync('logs/info.log', 'utf8');
const a = fs.readFileSync('auto member requirements/a.txt');
const b = fs.readFileSync('auto member requirements/b.txt');
const c = fs.readFileSync('auto member requirements/c.txt');
const d = fs.readFileSync('auto member requirements/d.txt');

const why = fs.readFileSync('main.css', 'utf8');

// emojis
// const doddleoddleemot = client.emojis.get("406267153843486720");

con.connect((err) => {
  if (err) throw err;
  console.log('Connected to mySQL Server.');
  console.log('DATABASE = doddlebot');
});

client.login(config.token);

client.on('error', console.error);

client.on('error', (error) => {
  errorLogger.fatal(`${error}`);
});

client.on('ready', () => {
  client.user.setActivity('with doddleolphin', { type: 'PLAYING' });
  console.log(`Logged in as ${client.user.username}`);
  console.log(info);
  console.log('ARCHIVE LOADED');
});

client.on('guildMemberAdd', (member) => {
  console.log(`${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
  infoLogger.info(`ARCHIVE: ${member.user.tag} (${member.id}) has joined ${member.guild.name}`);

  const name1 = [member.id];

  let useridFromMembersSQL = 'SELECT userid FROM members WHERE userid = ?';
  useridFromMembersSQL = mysql.format(useridFromMembersSQL, name1);

  con.query(useridFromMembersSQL, (err77, result) => {
    if (err77) throw err77;
    const resultObj = JSON.stringify(result);
    console.log(resultObj);
    if (resultObj.length > 3) {
      member.guild.channels.find('name', 'introduce-yourself').send(`Hey ${member} welcome back!`);
      con.query(`SELECT * FROM members WHERE userid = ${member.id}`, (err1, resultMember) => {
        const resultMembertObj = JSON.stringify(resultMember);
        const allresults = resultMembertObj.slice(1, -1);
        const results = JSON.parse(allresults);
        if (results.wasmember === '1') { 
          member.guild.channels.find('name', 'introduce-yourself').send('Looks like you where a member,');
          member.addRole(role.memberid);
          if (results.colour > '0') {
            console.log(results.colour);
            if (results.colour === '1') {
              member.addRole(role.limeid);
            } if (results.colour === '2') {
              member.addRole(role.roseid);
            } if (results.colour === '3') {
              member.addRole(role.blueskyid);
            } if (results.colour === '4') {
              member.addRole(role.lightvioletid);
            } if (results.colour === '5') {
              member.addRole(role.aquaid);
            }
            member.guild.channels.find('name', 'introduce-yourself').startTyping();
            setTimeout(() => {
              member.guild.channels.find('name', 'introduce-yourself').send('Looks like you had a colour role too,');
              member.guild.channels.find('name', 'introduce-yourself').stopTyping();
            }, Math.random() * (1 - 3) + 1 * 1000);
          } else if (results.female === '1') {
            member.addRole(role.femaleid);
          } if (results.male === '1') {
            member.addRole(role.maleid);
          } if (results.straight === '1') {
            member.addRole(role.straightid);
          } if (results.gay === '1') {
            member.addRole(role.gayid);
          } if (results.lesbian === '1') {
            member.addRole(role.lesbianid);
          } if (results.bisexual === '1') {
            member.addRole(role.bisexualid);
          } if (results.asexual === '1') {
            member.addRole(role.asexualid);
          } if (results.pansexual === '1') {
            member.addRole(role.pansexualid);
          } if (results.agender === '1') {
            member.addRole(role.agenderid);
          } if (results.nonbinary === '1') {
            member.addRole(role.nonbinaryid);
          } if (results.genderfluid === '1') {
            member.addRole(role.genderfluidid);
          } if (results.trans === '1') {
            member.addRole(role.transid);
          } if (results.hehim === '1') {
            member.addRole(role.hehimid);
          } if (results.sheher === '1') {
            member.addRole(role.sheherid);
          } if (results.theythem === '1') {
            member.addRole(role.theythemid);
          } if (results.musician === '1') {
            member.addRole(role.musicianid);
          } if (results.artist === '1') {
            member.addRole(role.artistid);
          } if (results.memetrash === '1') {
            member.addRole(role.memetrashid);
          }
          member.guild.channels.find('name', 'introduce-yourself').startTyping();
          setTimeout(() => {
            member.guild.channels.find('name', 'introduce-yourself').send('If you had any Personal roles, I have added them!');
            member.guild.channels.find('name', 'introduce-yourself').stopTyping();
          }, Math.random() * (1 - 3) + 1 * 1000);
        }
      });
    } else {
      const memberIDAray = [
        [`${member.id}`],
      ];
      con.query('INSERT INTO members (`userid`) VALUES ?', [memberIDAray], (err2) => {
        member.guild.channels.find('name', 'introduce-yourself').send(`${member}`);
        const embed = new Discord.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Welcome to doddlecord!**')
          .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
          .setDescription(welcomemsg);
        member.guild.channels.find('name', 'introduce-yourself').send({ embed });
      });
    }
  });
});

client.on('guildMemberRemove', (remember) => {
  if (remember.id !== '394816921989545985') {
    console.log(`${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
    infoLogger.info(`ARCHIVE: ${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
    remember.guild.channels.find('name', 'general').send(`${remember.user.tag.slice(0, -5)} Has left ${remember.guild.name}, hopefully we see them again soon!`);
  }
});

client.on('message', (message) => {
  const msgCount = count(message.cleanContent);
  const messageContent = [
    [`${message.author.id}`, `${message.author.tag}`, `${message.channel.name}`, `${msgCount}`],
  ];
  // con.query(`UPDATE archive SET messagecount = messagecount + 1 WHERE name = ${message.author.id}`);
  con.query('INSERT INTO archive (`nameid`, `name`, `channel`, `messagecount`) VALUES ?', [messageContent], (err3) => {
    if (err3) throw err3;
    console.log('Message Archived');
  });
  con.query(`UPDATE archive SET messagecount = messagecount + ${msgCount} WHERE id = 0`);

  if (message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (message.member.roles.has(role.managersjoshesid)) {
    // ES lint
  } else if (message.member.roles.has(role.modsid)) {
    // ESlint
  } else if (message.content.length > 13) {
    const pointsRandom = (Math.floor(Math.random() * 18) + 5);

    con.query(`SELECT * FROM userpoints WHERE name = ${message.author.id}`, (err, result) => {
      if (result.length > 0) {
      const resultJson = JSON.stringify(result)
      const results = JSON.parse(resultJson.slice(1, -1))
        con.query(`UPDATE userpoints SET points = points + ${pointsRandom} WHERE name = ${message.author.id}`)
        con.query(`UPDATE userpoints SET totalpoints = totalpoints + ${pointsRandom} WHERE name = ${message.author.id}`)
        con.query(`UPDATE userpoints SET pointscombined = pointscombined + ${pointsRandom} WHERE id = 5`);
        if (results.level * 100 < results.points) {
          con.query(`UPDATE userpoints SET points = 0 WHERE name = ${message.author.id}`);
          con.query(`SELECT totalpoints FROM userpoints WHERE name = ${message.author.id}`, (err4, totalPointsResult) => {
            const resultJsonObjTotalPoints = JSON.stringify(totalPointsResult);
            const totalPointsSlice = resultJsonObjTotalPoints.slice(16, -4);
            const totalpoints = totalPointsSlice.concat('00');
            con.query(`UPDATE userpoints SET totalpoints = ${totalpoints} WHERE name = ${message.author.id}`);
          });
          con.query(`UPDATE userpoints SET level = level + 1 WHERE name = ${message.author.id}`)
          console.log(`${message.author} Levelled up`);
          if (message.channel.name !== 'serious') {
            con.query(`SELECT * FROM userpoints WHERE name = ${message.author.id}`, (err4, pointsResult) => {
              const pointsJson = JSON.stringify(pointsResult)
              const results = JSON.parse(pointsJson.slice(1, -1))
              message.channel.send(`You are now level ${results.level}, ${message.author}`);
            });
          }
        }
      } else {
        const newUser = [
          [`${message.author.id}`, `${message.author.username}`, 1, 0],
        ];
        con.query('INSERT INTO userpoints (`name`,`username`, `level`, `points`) VALUES ?', [newUser], (err3) => {
          if (err3) throw err3;
          console.log('1 new member');
        });
      }
    });
  }

  if (message.member.roles.has(role.managersjoshesid)) {
    // ES lint
  } else if (message.member.roles.has(role.modsid)) {
    // ESlint
  } else if (message.content.length > 2) {
    const pointsRandom = (Math.floor(Math.random() * 22) + 9);

    con.query(`SELECT * FROM weeklypoints WHERE name = ${message.author.id}`, (err, result) => {
      if (result.length > 0) {
      const resultJson = JSON.stringify(result)
      const results = JSON.parse(resultJson.slice(1, -1))
        con.query(`UPDATE weeklypoints SET points = points + ${pointsRandom} WHERE name = ${message.author.id}`)
        con.query(`UPDATE weeklypoints SET totalpoints = totalpoints + ${pointsRandom} WHERE name = ${message.author.id}`)
        if (results.level * 100 < results.points) {
          con.query(`UPDATE weeklypoints SET points = 0 WHERE name = ${message.author.id}`);
          con.query(`SELECT totalpoints FROM weeklypoints WHERE name = ${message.author.id}`, (err4, totalPointsResult) => {
            const resultJsonObjTotalPoints = JSON.stringify(totalPointsResult);
            const totalPointsSlice = resultJsonObjTotalPoints.slice(16, -4);
            const totalpoints = totalPointsSlice.concat('00');
            con.query(`UPDATE weeklypoints SET totalpoints = ${totalpoints} WHERE name = ${message.author.id}`);
          });
          con.query(`UPDATE weeklypoints SET level = level + 1 WHERE name = ${message.author.id}`)
        }
      } else {
        const newUser = [
          [`${message.author.id}`, `${message.author.username}`, 1, 0],
        ];
        con.query('INSERT INTO weeklypoints (`name`,`username`, `level`, `points`) VALUES ?', [newUser], (err3) => {
          if (err3) throw err3;
          console.log('1 new weekly member');
        });
      }
    });
  }

  if (message.channel.name === 'doddlebot-chat') {
    clbot.write(message.content, (response) => {
      message.channel.startTyping();
      setTimeout(() => {
        message.channel.send(response.output).catch(console.error);
        message.channel.stopTyping();
      }, Math.random() * (1 - 3) + 1 * 1000);
    });
  }

  if (message.member.roles.has(role.memberid)) {
    // ESlint
  } else if (message.content.toLowerCase().match(a)) {
    if (message.content.toLowerCase().match(b)) {
      console.log(message.channel.name);
      if (message.content.toLowerCase().match(c)) {
        if (message.content.toLowerCase().match(d)) {
          message.member.addRole(role.memberid);
          message.channel.send('Your intro was so good I was able to tell!, I have added you as a member. Welcome to doddlecord!');
          console.log(`${message.author.tag} has been added by doddlebot`);
          infoLogger.info(`ARCHIVE: ${message.author.tag} had been added by doddlebot`);
          con.query(`UPDATE members SET wasmember = 1 WHERE userid = ${message.author.id}`, (err3) => {
            if (err3) throw err3;
          });
        } else return;
      } else return;
    } else return;
  } else return;

  if (message.content.indexOf(config.prefix) !== 0) return;

  // colour stuff
  if (command === 'colour') {
    const colour = args[0];
    if (colour === 'lime') {
      if (message.member.roles.has(role.limeid)) {
        message.reply('you have lime...you lemon');
      } else {
        con.query(`UPDATE members SET colour = 1 WHERE userid = ${message.author.id}`, (err3) => {
          if (err3) throw err3;
        });
        message.member.addRole(role.limeid);
        message.member.removeRole(role.roseid);
        message.member.removeRole(role.blueskyid);
        message.member.removeRole(role.lightvioletid);
        message.member.removeRole(role.aquaid);
        message.reply('you now have the lime colour!');
      }
    } else if (colour === 'rose') {
      if (message.member.roles.has(role.roseid)) {
        message.reply('roses are red, violets are blue, **you already have the rose red role**');
      } else {
        con.query(`UPDATE members SET colour = 2 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.roseid);
        message.member.removeRole(role.limeid);
        message.member.removeRole(role.blueskyid);
        message.member.removeRole(role.lightvioletid);
        message.member.removeRole(role.aquaid);
        message.reply('you now have the rose colour!');
      }
    } else if (colour === 'bluesky') {
      if (message.member.roles.has(role.blueskyid)) {
        message.reply('Roses are red violets are blue **you already have role colour blue**');
      } else {
        con.query(`UPDATE members SET colour = 3 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.blueskyid);
        message.member.removeRole(role.roseid);
        message.member.removeRole(role.limeid);
        message.member.removeRole(role.lightvioletid);
        message.member.removeRole(role.aquaid);
        message.reply('you now have the blue sky colour!');
      }
    } else if (colour === 'lightviolet') {
      if (message.member.roles.has(role.lightvioletid)) {
        message.reply('You already have light violet');
      } else {
        con.query(`UPDATE members SET colour = 4 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.lightvioletid);
        message.member.removeRole(role.limeid);
        message.member.removeRole(role.blueskyid);
        message.member.removeRole(role.roseid);
        message.member.removeRole(role.aquaid);
        message.reply('you now have the light violet colour!');
      }
    } else if (colour === 'aqua') {
      if (message.member.roles.has(role.aquaid)) {
        message.reply('roses are red, violets are blue, **you already have aqua blue**');
      } else {
        con.query(`UPDATE members SET colour = 5 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.aquaid);
        message.member.removeRole(role.roseid);
        message.member.removeRole(role.limeid);
        message.member.removeRole(role.blueskyid);
        message.member.removeRole(role.lightvioletid);
        message.reply('you now have the aqua colour!');
      }
    } else if (colour === 'remove') {
      con.query(`UPDATE members SET colour = 0 WHERE userid = ${message.author.id}`);
      if (message.member.roles.has(role.limeid)) {
        message.member.removeRole(role.limeid);
        message.reply('lime has been removed');
      } else if (message.member.roles.has(role.blueskyid)) {
        message.member.removeRole(role.blueskyid);
        message.reply('blue sky has been removed');
      } else if (message.member.roles.has(role.roseid)) {
        message.member.removeRole(role.roseid);
        message.reply('rose has been removed');
      } else if (message.member.roles.has(role.lightvioletid)) {
        message.member.removeRole(role.lightvioletid);
        message.reply('light violet has been removed');
      } else if (message.member.roles.has(role.aquaid)) {
        message.member.removeRole(role.aquaid);
        message.reply('aqua has been removed');
      } else message.reply("you don't have a role colour");
    }
  }
  // End of colour stuff

  // personality stuff
  if (command === 'pers') {
    if (message.member.roles.has(role.memberid)) {
      const per0 = args[0]; // Remember arrays are 0-based!.
      const per1 = args[1];
      const per2 = args[2];
      const per3 = args[3];
      const per4 = args[4];
      const per5 = args[5];
      const per6 = args[6];
      const per7 = args[7];
      const peradded1 = [per0, per1, per2, per3, per4, per5, per6, per7];
      const peradded = [`${per0}, ${per1}, ${per2}, ${per3}, ${per4}, ${per5}, ${per6}, ${per7}`];

      const peraddedjson = JSON.stringify(peradded);
      const peraddedNoUndef = peraddedjson.replace(/undefined/g, '');
      const removeenter = peraddedNoUndef.replace(/`/g, '');
      const quote = removeenter.replace(/,/g, '');
      const added = quote.slice(2, -2);

      console.log(added);
      if (added.match('Gay')) {
        con.query(`UPDATE members SET gay = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.gayid);
      }
      if (added.match('Straight')) {
        con.query(`UPDATE members SET straight = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.straightid);
      }
      if (added.match('Bisexual')) {
        con.query(`UPDATE members SET bisexual = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.bisexualid);
      }
      if (added.match('Asexual')) {
        con.query(`UPDATE members SET asexual = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.asexualid);
      }
      if (added.match('Pansexual')) {
        con.query(`UPDATE members SET pansexual = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.pansexualid);
      }
      if (added.match('Female')) {
        con.query(`UPDATE members SET female = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.femaleid);
      }
      if (added.match('Male')) {
        con.query(`UPDATE members SET male = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.maleid);
      }
      if (added.match('Lesbian')) {
        con.query(`UPDATE members SET lesbian = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.lesbianid);
      }
      if (added.match('Nonbinary')) {
        con.query(`UPDATE members SET nonbinary = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.nonbinaryid);
      }
      if (added.match('Fluid')) {
        con.query(`UPDATE members SET fluid = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.genderfluidid);
      }
      if (added.match('Agender')) {
        con.query(`UPDATE members SET agender = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.agenderid);
      }
      if (added.match('Transsexual')) {
        con.query(`UPDATE members SET trans = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.transid);
      }
      if (added.match('Hehim')) {
        con.query(`UPDATE members SET hehim = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.hehimid);
      }
      if (added.match('Sheher')) {
        con.query(`UPDATE members SET sheher = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.sheherid);
      }
      if (added.match('Theythem')) {
        con.query(`UPDATE members SET theythem = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.theythemid);
      }
      if (added.match('Musician')) {
        con.query(`UPDATE members SET musician = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.musicianid);
      }
      if (added.match('Artist')) {
        con.query(`UPDATE members SET artist = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.artistid);
      }
      if (added.match('Memetrash')) {
        con.query(`UPDATE members SET memetrash = 1 WHERE userid = ${message.author.id}`);
        message.member.addRole(role.memetrashid);
      }
      console.log(`${message.author.tag} has added ${added}`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} has added ${added}`);
      const embed = new Discord.MessageEmbed()
        .setColor(0xFEF65B)
        .addField('**personality roles added**', (peradded1));
      message.channel.send({ embed });
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  // end of personality stuff

  if (command === 'serverinfo') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setDescription(`**__${message.guild.name} Details__**`)
      .setThumbnail(message.guild.iconURL())
      .addField('Members', `${message.guild.memberCount - message.guild.members.filter(member => member.user.bot).size} Members`)
      .addField('Bots', `${message.guild.members.filter(member => member.user.bot).size} Bots`)
      .addField('Channels', `${message.guild.channels.filter(chan => chan.type === 'voice').size} voice / ${message.guild.channels.filter(chan => chan.type === 'text').size} text`)
      .addField('Mods', '@BrickOfWar @doctorzelda75 @emyflorence @philosophicalMoose')
      .addField('Managers', '@ShaunaSmells @TechLevelZero @Metakarp');
    message.channel.send({ embed });
  }

  if (command === 'colourhelp') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Colour Role Help**')
      .setDescription('This is the command to add colour to your name in doddlecord!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Colour Commands**', (colourcommandList));
    message.channel.send({ embed });
  }

  if (command === 'help') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Help**')
      .setDescription('Looking for help? yes...well look below for the category you need help with!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Commands**', (catcommandList));
    message.channel.send({ embed });
  }

  if (command === 'roles') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Help**')
      .setDescription('Looking for help? yes...well look below for the category you need help with!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Commands**', (catcommandList));
    message.channel.send({ embed });
  }

  if (command === 'persroles') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Personal Role Help**')
      .setDescription('Personal roles are added to give a little info on who you are to other members of doddlecord. They are completely optional roles though. Make __shore__ you spell it correctly and have a **capital letter** for each role or it will not add them!')
      .addField('Use', colouruse)
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Commands**', (perscommandList));
    message.channel.send({ embed });
  }

  if (command === 'allhelp') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**All Help**')
      .setDescription('Every command I can do!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Category Commands**', (catcommandList))
      .addField('**Other Commands**', (othercommandList))
      .addField('**Colour Commands**', (colourcommandList))
      .addField('**Personal Commands**', (perscommandList));
    message.channel.send({ embed });
  }

  if (command === 'extras') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Extra Help**')
      .setDescription('Just some extra commands that doddlebot can do!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Extra Commands**', (othercommandList));
    message.channel.send({ embed });
  }

  if (command === 'ukhelplines') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('UK Helplines')
      .setDescription(uk);
    message.channel.send({ embed });
  }

  if (command === 'ushelplines') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('USA Helplines')
      .setDescription(us);
    message.channel.send({ embed });
  }

  if (command === 'ping') {
    message.channel.send(`Ping is ${Math.round(client.ping)}ms`);
    infoLogger.info(`Ping was ${Math.round(client.ping)}ms`);
  }

  if (command === 'bug') {
    bugLogger.info(`ARCHIVE: ${message.author.tag} REPORTED ${message.content.slice(config.prefix.length).trim()}`);
    console.log(`${message.author.tag} REPORTING ${message.content.slice(config.prefix.length).trim()}`);
    message.channel.send(`Thanks ${message.author}, that has now been logged.`);
  }

  if (command === 'log') {
    if (message.member.roles.has(role.managersjoshesid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Info Log File', {
        files: ['./logs/info.log'],
      });
    } else if (message.member.roles.has(role.modsid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Info Log File', {
        files: ['./logs/info.log'],
      });
    } else return;
  }

  if (command === 'errors') {
    if (message.member.roles.has(role.managersjoshesid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Error Log File', {
        files: ['./logs/errors.log'],
      });
    } else if (message.member.roles.has(role.modsid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Error Log File', {
        files: ['./logs/errors.log'],
      });
    } else return;
  }

  if (message.channel.name === 'secrets-for-the-mods') {
    if (command === 'thisweekstop5') {
      con.query('SELECT username, level, points FROM weeklypoints ORDER BY totalpoints DESC LIMIT 5', (err, result) => {
        const one = JSON.stringify(result.slice(0, -4));
        const two = JSON.stringify(result.slice(1, -3));
        const three = JSON.stringify(result.slice(2, -2));
        const four = JSON.stringify(result.slice(3, -1));
        const five = JSON.stringify(result.slice(4));
  
        const first = JSON.parse(one.slice(1, -1))
        const second = JSON.parse(two.slice(1, -1))
        const third = JSON.parse(three.slice(1, -1))
        const fourth = JSON.parse(four.slice(1, -1))
        const fifth = JSON.parse(five.slice(1, -1))
        console.log(first.level, two, three, four, five)
        
        const embed = new Discord.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle("**doddlecord's Top 5 This Week's**")
          .addField(`#1: ${first.username}`, `At level **${first.level}** with **${first.points}** points`)
          .addField(`#2: ${second.username}`, `At level **${second.level}** with **${second.points}** points`)
          .addField(`#3: ${third.username}`, `At level **${third.level}** with **${third.points}** points`)
          .addField(`#4: ${fourth.username}`, `At level **${fourth.level}** with **${fourth.points}** points`)
          .addField(`#5: ${fifth.username}`, `At level **${fifth.level}** with **${fifth.points}** points`)
        message.channel.send({ embed });
        message.channel.send('Is this ok to send and use? (d!send)');
      });
    }
  }

  if (message.channel.name === 'secrets-for-the-mods') {
    if (command === 'send') {
      con.query('SELECT username, level, points FROM weeklypoints ORDER BY totalpoints DESC LIMIT 5', (err, result) => {
        const one = JSON.stringify(result.slice(0, -4));
        const two = JSON.stringify(result.slice(1, -3));
        const three = JSON.stringify(result.slice(2, -2));
        const four = JSON.stringify(result.slice(3, -1));
        const five = JSON.stringify(result.slice(4));
  
        const first = JSON.parse(one.slice(1, -1))
        const second = JSON.parse(two.slice(1, -1))
        const third = JSON.parse(three.slice(1, -1))
        const fourth = JSON.parse(four.slice(1, -1))
        const fifth = JSON.parse(five.slice(1, -1))
        console.log(first.level, two, three, four, five)
        
        const embed = new Discord.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle("**doddlecord's Top 5 This Week's**")
          .addField(`#1: ${first.username}`, `At level **${first.level}** with **${first.points}** points`)
          .addField(`#2: ${second.username}`, `At level **${second.level}** with **${second.points}** points`)
          .addField(`#3: ${third.username}`, `At level **${third.level}** with **${third.points}** points`)
          .addField(`#4: ${fourth.username}`, `At level **${fourth.level}** with **${fourth.points}** points`)
          .addField(`#5: ${fifth.username}`, `At level **${fifth.level}** with **${fifth.points}** points`)
        message.guild.channels.find('name', 'important-announcements').send({ embed });
      });
      con.query('TRUNCATE TABLE weeklypoints')
    }
  }

  if (message.channel.name === 'secrets-for-the-bot') {
    if (command === 'cute') {
      message.guild.channels.find('name', 'introduce-yourself').send('I will look for you, I will find you and I will kill you. @BrickOfWar');
    }
  }

  if (message.channel.name === 'secrets-for-the-mods') {
    if (command === 'sendupdate') {
      message.guild.channels.find('name', 'important-announcements').send('@everyone');
      const embed = new Discord.MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('doddlecord Update')
        .addField('Serious Chat', 'With the content of the serious chat recently, it has come to our attention that messages about topics in the chat could be triggering to certain members of doddlecord. So we now have an __opt in system__. By defult everyone has had there access revoke to serious chat to gain access again please use **d!serious**')
      message.guild.channels.find('name', 'important-announcements').send({ embed });
    }
  }

  if (command === 'rank') {
    const name = message.content.slice(9, -1).replace(/!/g, '');
    if (name.length > 3) {
      con.query(`SELECT * FROM userpoints WHERE name = ${name}`, (err, result) => {
        const resultJsonObj = JSON.stringify(result);
        const results = JSON.parse(resultJsonObj.slice(1, -1))
        const level100 = (results.level * 100);
        const embed = new Discord.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle(`Rank Of ${results.username}`)
          .addField('Level', (results.level))
          .addField('Points', (results.points))
          .addField('There Next Level In', `${level100 - results.points} Points`);
        message.channel.send({ embed });
    });
    } else {
      con.query(`SELECT points FROM userpoints WHERE name = "${message.author.id}"`, (err, result) => {
        const resultJsonObj = JSON.stringify(result);
        const pointsReturn = resultJsonObj.slice(11, -2);
        con.query(`SELECT level FROM userpoints WHERE name = ${message.author.id}`, (err67, levelResult) => {
          const resultJsonObjLevel = JSON.stringify(levelResult);
          const level = resultJsonObjLevel.slice(10, -2);
          const level100 = (level * 100);
          const embed = new Discord.MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle(`**Your Rank ${message.author.username}**`)
            .addField('**Level**', (level))
            .addField('**Points**', (pointsReturn))
            .addField('Next Level In', `${level100 - pointsReturn} Points`);
          message.channel.send({ embed });
        });
      });
    }
  }

  if (command === 'stats') {
    
    // Total points combind
    con.query('SELECT pointscombined FROM userpoints WHERE id = 5', (err, result) => {
      const resultJsonObj = JSON.stringify(result);
      const results = JSON.parse(resultJsonObj.slice(1, -1))
      console.log(results.pointscombined)
    // Total mesages sent
    con.query('SELECT id FROM archive ORDER BY id DESC LIMIT 1', (err, result1) => {
      const resultJsonObj1 = JSON.stringify(result1);
      const results1 = JSON.parse(resultJsonObj1.slice(1, -1))
      console.log(results1.id + 10947) // add extra as DB was deleted
    // Word count
    con.query('SELECT messagecount FROM archive WHERE id = 0', (err, result2) => {
      const resultJsonObj2 = JSON.stringify(result2);
      const results2 = JSON.parse(resultJsonObj2.slice(1, -1))
      console.log(results2.messagecount)    
    // Member count
    const embed = new Discord.MessageEmbed()
    .setColor(0xFEF65B)
    .setTitle(`__${message.guild.name} Details__`)
    .addField('Members', `${message.guild.memberCount - message.guild.members.filter(member => member.user.bot).size} Members`)
    .addField('Bots', `${message.guild.members.filter(member => member.user.bot).size} Bots`)
    .addField('Channels', `${message.guild.channels.filter(chan => chan.type === 'voice').size} voice / ${message.guild.channels.filter(chan => chan.type === 'text').size} text`)
    // Top 5 channles
    .addField('Message Count', results2.messagecount)
    message.channel.send({ embed });
        })
      })
    })    
    // Top 5 Members of all time
    con.query('SELECT username, level, points FROM userpoints ORDER BY totalpoints DESC LIMIT 5', (err, result) => {
      const one = JSON.stringify(result.slice(0, -4));
      const two = JSON.stringify(result.slice(1, -3));
      const three = JSON.stringify(result.slice(2, -2));
      const four = JSON.stringify(result.slice(3, -1));
      const five = JSON.stringify(result.slice(4));

      const first = JSON.parse(one.slice(1, -1))
      const second = JSON.parse(two.slice(1, -1))
      const third = JSON.parse(three.slice(1, -1))
      const fourth = JSON.parse(four.slice(1, -1))
      const fifth = JSON.parse(five.slice(1, -1))
      console.log(first.level, two, three, four, five)
      
      const embed = new Discord.MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle("doddlecord's Top 5 of all time")
        .addField(`#1: ${first.username}`, `At level **${first.level}** with **${first.points}** points`)
        .addField(`#2: ${second.username}`, `At level **${second.level}** with **${second.points}** points`)
        .addField(`#3: ${third.username}`, `At level **${third.level}** with **${third.points}** points`)
        .addField(`#4: ${fourth.username}`, `At level **${fourth.level}** with **${fourth.points}** points`)
        .addField(`#5: ${fifth.username}`, `At level **${fifth.level}** with **${fifth.points}** points`)
      message.channel.send({ embed });
    });

    // Bot commands used

    // pers starts

  }

  function run() {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Welcome to doddlecord!**')
      .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
      .setDescription(welcomemsg);
    message.channel.send({ embed });
  }

  if (command === 'welcomeembedtest') {
    if (message.member.roles.has(role.managersjoshesid())) {
      run();
    }
    if (message.member.roles.has(role.modsid())) {
      run();
    }
  }

  if (command === 'top10') {
    con.query('SELECT username, level, points FROM userpoints ORDER BY totalpoints DESC LIMIT 10', (err, result) => {
      const one = JSON.stringify(result.slice(0, -9));
      const two = JSON.stringify(result.slice(1, -8));
      const three = JSON.stringify(result.slice(2, -7));
      const four = JSON.stringify(result.slice(3, -6));
      const five = JSON.stringify(result.slice(4, -5));
      const six = JSON.stringify(result.slice(5, -4));
      const seven = JSON.stringify(result.slice(6, -3));
      const eight = JSON.stringify(result.slice(7, -2));
      const nine = JSON.stringify(result.slice(8, -1));
      const ten = JSON.stringify(result.slice(9));

      const first = JSON.parse(one.slice(1, -1))
      const second = JSON.parse(two.slice(1, -1))
      const third = JSON.parse(three.slice(1, -1))
      const fourth = JSON.parse(four.slice(1, -1))
      const fifth = JSON.parse(five.slice(1, -1))
      const sixth = JSON.parse(six.slice(1, -1))
      const seventh = JSON.parse(seven.slice(1, -1))
      const eighth = JSON.parse(eight.slice(1, -1))
      const nineth = JSON.parse(nine.slice(1, -1))
      const tenth = JSON.parse(ten.slice(1, -1))
      
      const embed = new Discord.MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle("doddlecord's Top 10 at the moment**")
        .addField(`#1: ${first.username}`, `At level **${first.level}** with **${first.points}** points`)
        .addField(`#2: ${second.username}`, `At level **${second.level}** with **${second.points}** points`)
        .addField(`#3: ${third.username}`, `At level **${third.level}** with **${third.points}** points`)
        .addField(`#4: ${fourth.username}`, `At level **${fourth.level}** with **${fourth.points}** points`)
        .addField(`#5: ${fifth.username}`, `At level **${fifth.level}** with **${fifth.points}** points`)
        .addField(`#6: ${sixth.username}`, `At level **${sixth.level}** with **${sixth.points}** points`)
        .addField(`#7: ${seventh.username}`, `At level **${seventh.level}** with **${seventh.points}** points`)
        .addField(`#8: ${eighth.username}`, `At level **${eighth.level}** with **${eighth.points}** points`)
        .addField(`#9: ${nineth.username}`, `At level **${nineth.level}** with **${nineth.points}** points`)
        .addField(`#10: ${tenth.username}`, `At level **${tenth.level}** with **${tenth.points}** points`)
      message.channel.send({ embed });
    });
  }

  if (command === 'serious') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle("Serious chat opt in WARNING")
      .setDescription(serious)
    message.channel.send({ embed });
    con.query(`UPDATE userpoints SET serious = 1 WHERE name = ${message.author.id}`);
    function function2() {        
      con.query(`SELECT serious from userpoints WHERE name = ${message.author.id}`, (err, result) => {
        const resultJsonObj = JSON.stringify(result);
        const results = JSON.parse(resultJsonObj.slice(1, -1))
        console.log(results.serious)
        if (results.serious === 1) {
          con.query(`UPDATE userpoints SET serious = 0 WHERE name = ${message.author.id}`);
          message.channel.send('Timed out')
        }
      })
    }
    setTimeout(function2, 60000);
  }

  if (command === 'yes') {
    con.query(`SELECT serious from userpoints WHERE name = ${message.author.id}`, (err, result) => {
      const resultJsonObj = JSON.stringify(result);
      const results = JSON.parse(resultJsonObj.slice(1, -1))
      if (results.serious > 0) {
        message.member.addRole(role.serid)
        message.channel.send('You now have access')
        con.query(`UPDATE userpoints SET serious = 2 WHERE name = ${message.author.id}`)
      } else {
        message.channel.send('Use d!serious first')
      }
    })
  }

  if (command === 'no') {
    con.query(`UPDATE userpoints SET serious = 0 WHERE name = ${message.author.id}`)
    message.channel.send('Got it')
  }

  if (command === 'flip') {
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

  if (command === 'convert') {
    const why1 = JSON.stringify(why);
    const add = why1.replace(/{/g, '{\r');
    const add1 = add.replace(/}/g, '\r}\r');
    const add2 = add1.replace(/;/g, ';\r');
    console.log(add2);
  }

  if (command === 'findtitle') {
    const add555 = (browserHis.BrowserHistory.replace(/{},/g, ''));
    console.log(add555.title)
  }

  if (command === 'testing1') {
    const name = message.content.slice(13, -1);
    console.log(message.content)
    console.log(name.replace(/!/g, ''));
  }

  if (command === 'patreon') {
    message.channel.send('Support the bots @-----> <https://www.patreon.com/benhunter>');
  }
});
