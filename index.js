/* eslint consistent-return: 0, no-console: 0 */

// doddlebot 1.1.7 by Ben Hunter

const Discord = require('discord.js');

const config = require('./config.json');

const role = require('./roles.json');

const mysql = require('mysql');

const Cleverbot = require('cleverbot-node');

const upsidedown = require('upsidedown');

const fs = require('fs');

const log4js = require('log4js');

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
const info = fs.readFileSync('logs/info.log', 'utf8');
const a = fs.readFileSync('auto member requirements/a.txt');
const b = fs.readFileSync('auto member requirements/b.txt');
const c = fs.readFileSync('auto member requirements/c.txt');
const d = fs.readFileSync('auto member requirements/d.txt');

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
  client.user.setActivity('dodie on repeat', { type: 'LISTENING' });
  console.log(`Logged in as ${client.user.username}`);
  console.log(info);
  console.log('ARCHIVE LOADED');
});

client.on('guildMemberAdd', (member) => {
  console.log(`${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
  infoLogger.info(`ARCHIVE: ${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
  member.guild.channels.find('name', 'introduce_yourself').send(`${member}`);
});

client.on('guildMemberAdd', (embedwelcome) => {
  const embed = new Discord.MessageEmbed()
    .setColor(0xFEF65B)
    .setTitle('**Welcome to doddlecord!**')
    .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
    .setDescription(welcomemsg);
  embedwelcome.guild.channels.find('name', 'introduce_yourself').send({ embed });
});

client.on('guildMemberRemove', (remember) => {
  console.log(`${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
  infoLogger.info(`ARCHIVE: ${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
  remember.guild.channels.find('name', 'general').send(`${remember.user.tag.slice(0, -5)} Has left ${remember.guild.name}, hopefully we see them again soon!`);
});

client.on('message', (message) => {
  if (message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  // start of points and levels
  // using perpared statements to avoid SQL injection
  const pointsRandom = (Math.floor(Math.random() * 18) + 5);

  let fromUserPointsSQL = 'SELECT * FROM userpoints WHERE name = ?';
  const name = [message.author.id];
  const username = [message.author.username];
  fromUserPointsSQL = mysql.format(fromUserPointsSQL, name);

  let usernameFromUserPointsSQL = 'SELECT username FROM userpoints WHERE name = ?';
  usernameFromUserPointsSQL = mysql.format(usernameFromUserPointsSQL, name);

  let pointsFromUserPointsSQL = 'SELECT points FROM userpoints WHERE name = ?';
  pointsFromUserPointsSQL = mysql.format(pointsFromUserPointsSQL, name);

  let setTotalPointsSQL = `UPDATE userpoints SET totalpoints = totalpoints + ${pointsRandom} WHERE name = ?`;
  setTotalPointsSQL = mysql.format(setTotalPointsSQL, name);

  let totalPointsFromUserPointsSQL = 'SELECT totalpoints FROM userpoints WHERE name = ?';
  totalPointsFromUserPointsSQL = mysql.format(totalPointsFromUserPointsSQL, name);

  let setPointsSQL = `UPDATE userpoints SET points = points + ${pointsRandom} WHERE name = ?`;
  setPointsSQL = mysql.format(setPointsSQL, name);

  let levelFromUserPointsSQL = 'SELECT level FROM userpoints WHERE name = ?';
  levelFromUserPointsSQL = mysql.format(levelFromUserPointsSQL, name);

  let userPointsSetLevel = 'UPDATE userpoints SET level = level + 1 WHERE name = ?';
  userPointsSetLevel = mysql.format(userPointsSetLevel, name);

  let userPointsSetUsernameSQL = `UPDATE userpoints SET username = ? WHERE name = ${name}`;
  userPointsSetUsernameSQL = mysql.format(userPointsSetUsernameSQL, username);

  con.query(fromUserPointsSQL, (err0, resultName) => {
    if (err0) throw err0;
    if (message.member.roles.has(role.managersjoshesid)) {
      // ESlint
    } else if (resultName.length > 0) {
      if ((message.content.length) > 4) {
        con.query(setTotalPointsSQL);
        con.query(setPointsSQL, (err1) => {
          if (err1) throw err1;
          con.query(pointsFromUserPointsSQL, (err2, resultPoints) => {
            if (err2) throw err2;
            const resultJsonObj = JSON.stringify(resultPoints);
            const points = resultJsonObj.slice(11, -2);
            con.query(levelFromUserPointsSQL, (err3, levelResult) => {
              if (err3) throw err3;
              const resultJsonObjLevel = JSON.stringify(levelResult);
              const findLevel = resultJsonObjLevel.indexOf('level');
              const levelReturn = resultJsonObjLevel.slice(findLevel, -2);
              const level = levelReturn.slice(7);
              con.query(usernameFromUserPointsSQL, (err77, usernameResult) => {
                if (err77) throw err77;
                const usernameJsonOBJ = JSON.stringify(usernameResult);
                const usernameslice = usernameJsonOBJ.slice(14, 3);
                if (username !== usernameslice) {
                  con.query(userPointsSetUsernameSQL, (err88) => {
                    if (err88) throw err88;
                  });
                }
              });
              console.log(`${message.author.tag} got ${pointsRandom} points! Level: ${level} Points: ${points}`);
              if (points > 100 * level) {
                con.query(`UPDATE userpoints SET points = 0 WHERE name = ${message.author.id}`);
                con.query(totalPointsFromUserPointsSQL, (err4, totalPointsResult) => {
                  const resultJsonObjTotalPoints = JSON.stringify(totalPointsResult);
                  const totalPointsSlice = resultJsonObjTotalPoints.slice(16, -4);
                  const totalpoints = totalPointsSlice.concat('00');
                  con.query(`UPDATE userpoints SET totalpoints = ${totalpoints} WHERE name = ${message.author.id}`);
                });
                con.query(userPointsSetLevel, (err5) => {
                  if (err5) throw err5;
                  console.log(`${message.author} Levelled up`);
                  if (message.channel.name !== 'serious') {
                    message.channel.send(`You are now leaving level ${level}, ${message.author}`);
                  }
                });
              }
            });
          });
        });
      }
    } else {
      const newUser = [
        [`${message.author.id}`, `${message.author.tag}`, 1, 0],
      ];
      con.query('INSERT INTO userpoints (`name`,`username`, `level`, `points`) VALUES ?', [newUser], (err3) => {
        if (err3) throw err3;
        console.log('1 record inserted');
      });
    }
  });

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
      if (message.content.toLowerCase().match(c)) {
        if (message.content.toLowerCase().match(d)) {
          message.member.addRole(role.memberid);
          message.channel.send('Your intro was so good I was able to tell!, I have added you as a member. Welcome to doddlecord!');
          console.log(`${message.author.tag} has been added by doddlebot`);
          infoLogger.info(`ARCHIVE: ${message.author.tag} had been added by doddlebot`);
        } else return;
      } else return;
    } else return;
  } else return;

  if (message.content.indexOf(config.prefix) !== 0) return;

  // colour stuff
  if (command === 'colour') {
    const colour = args[0]; // Remember arrays are 0-based!.
    if (colour === 'lime') {
      if (message.member.roles.has(role.limeid)) {
        message.reply('you have lime...you lemon');
      } else {
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
        message.member.addRole(role.aquaid);
        message.member.removeRole(role.roseid);
        message.member.removeRole(role.limeid);
        message.member.removeRole(role.blueskyid);
        message.member.removeRole(role.lightvioletid);
        message.reply('you now have the aqua colour!');
      }
    } else if (colour === 'remove') {
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
      const peradded1 = [per1, per2, per3, per4, per5, per6, per7];
      const peradded = [`${per0}, ${per1}, ${per2}, ${per3}, ${per4}, ${per5}, ${per6}, ${per7}`];

      const peraddedjson = JSON.stringify(peradded);
      const peraddedNoUndef = peraddedjson.replace(/undefined/g, '');
      const removeenter = peraddedNoUndef.replace(/`/g, '');
      const quote = removeenter.replace(/,/g, '');
      const added = quote.slice(2, -2);

      console.log(added);
      if (added.match('Gay')) {
        message.member.addRole(role.gayid);
      }
      if (added.match('Straight')) {
        message.member.addRole(role.straightid);
      }
      if (added.match('Bisexual')) {
        message.member.addRole(role.bisexualid);
      }
      if (added.match('Asexual')) {
        message.member.addRole(role.asexualid);
      }
      if (added.match('Pansexual')) {
        message.member.addRole(role.pansexualid);
      }
      if (added.match('Female')) {
        message.member.addRole(role.femaleid);
      }
      if (added.match('Male')) {
        message.member.addRole(role.maleid);
      }
      if (added.match('Nonbinary')) {
        message.member.addRole(role.nonbinaryid);
      }
      if (added.match('Fluid')) {
        message.member.addRole(role.genderfluidid);
      }
      if (added.match('Agender')) {
        message.member.addRole(role.agenderid);
      }
      if (added.match('Transsexual')) {
        message.member.addRole(role.transid);
      }
      if (added.match('Hehim')) {
        message.member.addRole(role.hehimid);
      }
      if (added.match('Sheher')) {
        message.member.addRole(role.sheherid);
      }
      if (added.match('Theythem')) {
        message.member.addRole(role.theythemid);
      }
      if (added.match('Musician')) {
        message.member.addRole(role.musicianid);
      }
      if (added.match('Artist')) {
        message.member.addRole(role.artistid);
      }
      if (added.match('Memetrash')) {
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
      .addField('Mods', '@BrickOfWar @doctorzelda75 @emyflorence @philosophicalMoose @imawetnoodle')
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
      con.query('SELECT username, level, points FROM userpoints ORDER BY totalpoints DESC LIMIT 5', (err, result) => {
        const resultJsonObj = JSON.stringify(result);
        const remove = resultJsonObj.replace(/{"username"/g, '');
        const removeenter = remove.replace(/},:/g, '£&£\r');
        const quote = removeenter.replace(/"/g, '');
        const addspaceLevel = quote.replace(/level:/g, ' Level: ');
        const addspacePoints = addspaceLevel.replace(/points:/g, ' Points: ');
        const line = addspacePoints.replace(/, /g, '\r');
        const add = line.replace(/£&£/g, '\r');
        const embed = new Discord.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle("**doddlecord's Top 5 This Week's**")
          .setDescription(add.slice(2, -2));
        message.channel.send({ embed });
        message.channel.send('Is this ok to send and use? (d!send)');
      });
    }
  }

  if (message.channel.name === 'secrets-for-the-mods') {
    if (command === 'send') {
      con.query('SELECT username, level, points FROM userpoints ORDER BY totalpoints DESC LIMIT 5', (err, result) => {
        const resultJsonObj = JSON.stringify(result);
        const remove = resultJsonObj.replace(/{"username"/g, '');
        const removeenter = remove.replace(/},:/g, '£&£\r');
        const quote = removeenter.replace(/"/g, '');
        const addspaceLevel = quote.replace(/level:/g, ' Level: ');
        const addspacePoints = addspaceLevel.replace(/points:/g, ' Points: ');
        const line = addspacePoints.replace(/, /g, '\r');
        const add = line.replace(/£&£/g, '\r');
        const embed = new Discord.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle("**doddlecord's Top 5 This Week's**")
          .setDescription(add.slice(2, -2));
        message.guild.channels.find('name', 'important-announcements').send({ embed });
      });
    }
  }

  if (message.channel.name === 'secrets-for-the-mods') {
    if (command === 'sendupdate') {
      message.guild.channels.find('name', 'important-announcements').send('@everyone');
      const embed = new Discord.MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('doddlebot V1.2 OVERHAUL Update')
        .addField('#doddlebot-chat', 'The Final bits of code were added for #doddlebot-chat and now does not slow down the bot.')
        .addField('Menus', 'Help menus got an overhaul now with a new way to add colours and personal roles! Use d!help to have a look!')
        .addField('d!flip', "a fun way to get someone's attention. (pssst try d!flip @doddlebot)")
        .addField('Points', 'A full points system has been implemented! d!rank and d!top10 are the commands.')
        .addField('Top5', 'The top 5 active members within the week get the  brand new role @top5thisweek (Every Sunday)')
        .addField('Colour', 'And last but not least a new role colour @Aqua has been added!');
      message.guild.channels.find('name', 'important-announcements').send({ embed });
    }
  }

  if (command === 'rank') {
    con.query(`SELECT points FROM userpoints WHERE name = "${message.author.id}"`, (err, result) => {
      const resultJsonObj = JSON.stringify(result);
      const pointsReturn = resultJsonObj.slice(11, -2);
      con.query(levelFromUserPointsSQL, (err67, levelResult) => {
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
      const resultJsonObj = JSON.stringify(result);
      const remove = resultJsonObj.replace(/{"username"/g, '');
      const removeenter = remove.replace(/},:/g, '£&£\r');
      const quote = removeenter.replace(/"/g, '');
      const addspaceLevel = quote.replace(/level:/g, ' Level: ');
      const addspacePoints = addspaceLevel.replace(/points:/g, ' Points: ');
      const line = addspacePoints.replace(/, /g, '\r');
      const add = line.replace(/£&£/g, '\r');
      const embed = new Discord.MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle("**doddlecord's Top 10**")
        .setDescription(add.slice(2, -2));
      message.channel.send({ embed });
    });
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

  if (command === 'testing') {
    // testing
  }

  if (command === 'patreon') {
    message.channel.send('Support the bots @-----> <https://www.patreon.com/benhunter>');
  }
});
