
// doddlebot 1.3 WiP author: Ben Hunter

const Client = require('discord.js');
const crypto = require('crypto');
const config = require('./json_files/config.json');
const bot = require('./json_files/data.json');
const cassandra = require('cassandra-driver');
// const Uuid = require('cassandra-driver').types.Uuid;
// const mysql = require('mysql');
const { spawn } = require('child_process')//.spawn;
const upsidedown = require('upsidedown');
var moment = require('moment-timezone');
const compare = require('js-levenshtein'); // to be used for intro comparions
const extIP = require('external-ip')();
const fs = require('fs');
const CronJob = require('cron').CronJob

var justJoined = false

console.log(Client)

let globalPlsWork;

// Cassandra config
const consandra = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'doddlecord'
});

///////////////////////
///  Function land  ///
///////////////////////

/**
 * Gets the top x users, excluding mods
 * @param  {Object} message - A discord.js message object
 * @param  {number} x - The number of users you want to retrive
 * @param  {string} mode - "total" or "weekly"
 * @returns {Object} - A discord.js embed with the top x members
 */
function topx(message, x, mode, callback) {

  let queery = ''; // geddit? It's because we're all gay.
  let title = '';

  if (mode == 'total') {
    queery = 'SELECT userid, nickname, level, points, totalpoints FROM member_data';
    title = `doddlecord's top ${x} of all time`;
  } else if (mode == 'weekly') {
    queery = 'SELECT userid, nickname, wkylevel, wkypoints, wkytotalpoints FROM member_data';
    title = `doddlecord's top ${x} this week`;
  }

  consandra.execute(queery, {prepare: true},(err, result) => {
    var topxArray = [];

    for (let i = 0; i < result.rowLength; i++) {
      if (mode == 'total') topxArray.push({userid:`${result.rows[i].userid}`, nickname:`${result.rows[i].nickname}`, level:`${result.rows[i].level}`, points:`${result.rows[i].points}`, totalpoints:`${result.rows[i].totalpoints}`})
      if (mode == 'weekly') topxArray.push({userid:`${result.rows[i].userid}`, nickname:`${result.rows[i].nickname}`, level:`${result.rows[i].wkylevel}`, points:`${result.rows[i].wkypoints}`, totalpoints:`${result.rows[i].wkytotalpoints}`})
    }

    (function(){
      if (typeof Object.defineProperty === 'function'){
        try{Object.defineProperty(Array.prototype,'sortBy',{value:sortDBdata}); }catch(e){}
      }
      if (!Array.prototype.sortBy) Array.prototype.sortBy = sortDBdata;
      
      function sortDBdata(f){
        for (var i=this.length;i;){
          var o = this[--i];
          this[i] = [].concat(f.call(o,o,i),o);
        }
        this.sort(function(a,b){
          for (var i=0,len=a.length;i<len;++i){
            if (a[i]!=b[i]) return a[i]<b[i]?-1:1;
          } return 0;
        });
        for (var i=this.length;i;){
          this[--i]=this[i][this[i].length-1];
        } return this;
      }
    })();

    globalPlsWork = topxArray.sortBy(function(o){ return  -o.totalpoints })

    console.log('Sorted (Excluding mods) limited to x length', topxArray);
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
  return client.channels.cache.get(bot.channels[channel]) // cache?
}
// adds or removes roles
/**
 * Role function
 * @param  {string} AOR - 'add' or 'remove'
 * @param  {Object} message - message Obj passthought
 * @param  {Object} role - role id
 */
function role(AOR, message, role) {
  message.guild.members.cache.get(message.author.id).roles[AOR](role);
}
/**
 * MemberSQL function
 * @param  {string} memberID - Members's discord ID
 */
function memberData(userID, displayName, roles) {
  consandra.execute('INSERT INTO member_data (userid,nickname,level,points,totalpoints,score,roles,wkylevel,wkypoints,wkytotalpoints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [userID + 22, displayName, 1, 0, 0, 0, roles, 1, 0, 0], { prepare: true }, err => {
    if (err) {
      console.log(err)
      client.channels.cache.get('400762131252772866').send(`There was an error with ${displayName}'s (${userID}) data, doddlebot has recoved but the DB table may need checking`)
    }
    console.log('New Member Data Added To The Table');
  });
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
  consandra.execute('INSERT INTO logger (id,type,userid,message,date) VALUES (uuid(), ?, ?, ?, ?)', [ type, member.id, data, Date.now()], { prepare: true }, err => {
    if (err) {
      console.log(err)
    }
  });
}

consandra.connect();

const client = new Client.Client();

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
  // console.log(client.guilds.cache.get('337013993669656586').members.filter(m => {return m.presence.status === 'online'}).size);
  client.user.setActivity('With doddleolphin', { type: 'PLAYING' });
  console.log(`Logged in as ${client.user.username} ${bot.system.ver}`);

  const job = new CronJob('0 12 * * 0', function() {
    const serverChannels = client.guilds.cache.get('337013993669656586').channels.cache;
    const Channel = serverChannels.get(bot.channels.general);
    Channel.messages.fetch(Channel.lastMessageID).then(message => {
      client.guilds.cache.get('337013993669656586').members.prune({
        days: 7, reason: 'members have not introduced them selfs within and have been offline for 7 days'
      }).then(prune => {
        logger('system', client.user, `This week, ${prune} members have been removed`);
        serverChannels.get(bot.channels.testfacility).send(`The prune this week resuted in ${prune} members being removed`)
      })

      topx(message, 5, 'weekly', () => {
        const embed = new Client.MessageEmbed()
        embed.setColor(0xFEF65B)
        embed.setTitle('doddlecord\'s Top 5 of this week')
        for (var j = 0; j < 5; j++) {
          embed.addField(`#${j+1}: ${globalPlsWork[j].nickname}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
        }
        const top5remove = message.guild.roles.cache.get(bot.role.top5).members.map(m=>{return m.user});
        setTimeout(() => {
          for (var k = 0; k < top5remove.length; k++) {
            // need to fix cache issues 
            message.guild.members.cache.get(top5remove[k].id).roles['remove'](bot.role.top5);
          }
        }, 1000);
        serverChannels.get(bot.channels.themods).send({ embed });
        serverChannels.get(bot.channels.themods).send('@everyone, does this look ok? Is it sunday? If everything is ok, use `d!send` to publish')
      });
    })
  });
  if (__dirname.match('STABLE')) {
    job.start();
  }
});

// New memeber procedure
// Discord login, looks to see if in DEV or STABLE branch
client.on('guildMemberAdd', member => {
  justJoined == true
  if (__dirname.match('STABLE')) {
    const message = member
    function roleAM2(AOR, message, role) {
      message.guild.members.cache.get(message.id).roles[AOR](role);
    }
    function welcomeEmbed() {
      channel('introduceyourself').send(`${member.guild.members.cache.get(member.id)}`);
      const embed = new Client.MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Welcome to doddlecord!**')
        .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
        .setDescription(bot.text.welcomemsg);
      channel('introduceyourself').send(embed)
    }

    console.log(`${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
    logger('info' , member, `${member.user.tag} has joined ${member.guild.name}`);

    consandra.execute(`SELECT * FROM member_data WHERE userid = ${member.id}`, (err, result) => {
      const row = result.first();
      if (row != null) {
        if (row['score'] > 1000) {
          channel('introduceyourself').send(`Hey ${member.guild.members.cache.get(member.id)} welcome back! Looks like you where a member`);
          roleAM2('add', member, bot.role.memberid);
        } else {
          welcomeEmbed()
        }
      } else {
        welcomeEmbed()
      }
    });
  }
});

client.on('guildMemberRemove', remember => {
  consandra.execute(`DELETE FROM weeklypoints WHERE userid = ${remember.id}`)
  console.log(`${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`, '\nMemberData Has Been removed');
  logger('info' , remember, `${remember.user.tag} Has left ${remember.guild.name}`);
  channel('general').send(`${remember.user.tag.slice(0, -5)} has left, can we get some Fs in chat please`)
});

client.on('message', message => {
  // This checks if the member had data on the db if not it will insert a new row with the members data
  var memberPromise = new Promise(function(resolve, reject) {
    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (err4, dbData) => {
      if (justJoined === true) return;
      console.log(dbData)
      const row = dbData.first();
      if (row === null) {
        const user = message.author.id
        message.client.guilds.cache.get('337013993669656586').members.fetch({ user, cache: false }).then(memberDataDB => {
          consandra.execute('INSERT INTO member_data (userid,nickname,level,points,totalpoints,score,roles,wkylevel,wkypoints,wkytotalpoints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.author.id, memberDataDB.displayName, 1, 0, 0, 0, memberDataDB._roles.toString(), 1, 0, 0], { prepare: true }, err => {
            if (err) {
              console.log(err)
              client.channels.cache.get('400762131252772866').send(`There was an error with ${displayName}'s (${userID}) data, doddlebot has recoved but the DB table may need checking`)
            }
            console.log('New Member Data Added To The Table');
          });
          reject(true)
        })
      } else {
        resolve(true)
      }
    })
  });

  memberPromise.then(function(value) {

    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (err4, data) => {
      const dbData = data.first();
      const args = message.content.toLowerCase().slice(config.prefix.length).trim().split(/ +/g);
      const command = args.shift().toLowerCase();
      message.content = message.content.toLowerCase();
      if (message.content === 'd!kill') {
        if (message.member.roles.cache.has(bot.role.managersjoshesid) || (message.author.id === '394424134337167360')) {
          logger('system' , message.author, `${message.author.tag} Had shutdown doddlebot')`);
          process.exit();
        }
      }

      if (message.author.bot) return;

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
          if ( parseInt(dbData['dataepoch']) < (Date.now() - 6.048e+8)) {
            consandra.execute(`UPDATE member_data SET dataepoch = '${Date.now()}' WHERE id = ${dbData['id']}`);
            const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g);
            const joinDateText = `\nYou_joined_on_${joinDateArray[0]}_${joinDateArray[1]}_${joinDateArray[2]}_${joinDateArray[3]}_at_${joinDateArray[4]}`
            logger('info', message.author, 'had requested their data')
            const dateOfPDF = new Date(parseInt(dbData['dataepoch']))
            const nextDate = new Date(parseInt(dbData['dataepoch']) + 6.048e+8); // The 0 there is the key, which sets the date to the epoch
            message.channel.send('Getting your data...')
            setTimeout(() => {
              message.channel.send(' You can only do this once a week, The next time you can request your PDF is after ' + nextDate.toUTCString())
            }, 1500)
            console.log(args[0])
            // const data = fork('./tools/data.js', [message.author.id, message.author.tag, joinDateText])
            // data.send('start')
            var cp = spawn('node', ['data', message.author.id, message.author.tag, joinDateText], {cwd:'./tools/'}, (error, stdout, stderr) => {
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
            const dateOfPDF = new Date(parseInt(dbData['dataepoch']))
            const nextDate = new Date(parseInt(dbData['dataepoch']) + 6.048e+8); // The 0 there is the key, which sets the date to the epoch
            message.channel.send('You have alrady requested your data this past week. The next time you can request your data is after ' + nextDate.toUTCString())
            message.channel.send(`Here is your PDF from ${dateOfPDF.toUTCString()}`, {
              files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
            });
          }
        }
        
      }
      if (message.channel.type === 'dm') return;
      if (message.content.length > 8) {
        const pointsRandom = (Math.floor(Math.random() * 18) + 5)
        const WpointsRandom = (Math.floor(Math.random() * 22) + 9)
        const pointsJSON = { 'points':`${pointsRandom + dbData['points']}`, 'totalpoints':`${pointsRandom + dbData['totalpoints']}` };
        const wkyPointsJSON = { 'points':`${WpointsRandom + dbData['wkypoints']}`, 'totalpoints':`${WpointsRandom + dbData['wkytotalpoints']}` };

        if (dbData['level'] * 100 <= pointsJSON.points) {
          const rounedTotal = Math.round(pointsJSON.totalpoints/100) * 100
          const queries = [
            { query: `UPDATE  member_data SET level = ${dbData['level'] + 1} WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET points = 0 WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET totalpoints = ${rounedTotal} WHERE userid = '${dbData['userid']}'` }
          ];
          consandra.batch(queries).then( console.log('Member Leveled Up') );
          message.channel.send(`You are now level ${dbData['level'] + 1}, ${message.author}`);
        } else {
          const queries = [
            { query: `UPDATE  member_data SET points = ${pointsJSON.points} WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET totalpoints = ${pointsJSON.totalpoints} WHERE userid = '${dbData['userid']}'` }
          ];
          consandra.batch(queries)
        }
        if (dbData['wkylevel'] * 100 <= wkyPointsJSON.points) {
          const rounedTotal = Math.round(wkyPointsJSON.totalpoints/100) * 100
          const queries = [
            { query: `UPDATE  member_data SET wkylevel = ${dbData['wkylevel'] + 1} WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET wkypoints = 0 WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET wkytotalpoints = ${rounedTotal} WHERE userid = '${dbData['userid']}'` }
          ];
          consandra.batch(queries).then(console.log('[weekly] Member Leveled Up'));
        } else {
          const queries = [
            { query: `UPDATE  member_data SET wkypoints = ${wkyPointsJSON.points} WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET wkytotalpoints = ${wkyPointsJSON.totalpoints} WHERE userid = '${dbData['userid']}'` }
          ];
          consandra.batch(queries, { })
          .then(function() {
            // All queries have been executed successfully
          })
          .catch(function(err) {
            console.log(err)
            // None of the changes have been applied
          });
        }
      }

      // Adds server metadata to the table, server stats can be shown with this data
      // need to add points gained when points is back
      consandra.execute('INSERT INTO message_metadata (id,userid,username,channel,channelid,date,wordcount,pointscount) VALUES (uuid(),?,?,?,?,?,?,?)', [message.author.id, message.member.displayName, message.channel.name, message.channel.id, Date.now(), count, 0], { prepare: true }, err => {
        if (err) throw err;
        console.log('Message Metadata Archived');
      });
        
      if (message.member.roles.cache.get(bot.role.managersjoshesid)) {
        // ESlint
      } else if (message.member.roles.cache.get(bot.role.modsid)) {
        // ESlint
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

      if (!message.member.roles.cache.get(bot.role.memberid)) {
        let score = []
        const cont = message.cleanContent.toLowerCase();
        function autoMember() {
          for (var word in bot.lookup) {
            if (cont.indexOf(word) != -1) {
              score.push(bot.lookup[word])
            }
          }
        }
        autoMember();
        var sum = score.reduce(function(a, b){
          return a + b;
        }, 0);
        console.log(sum)
        if (sum >= 1000) {
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
          role('add', message, bot.role.memberid);
          logger('info' , message.author, `${message.author.tag} had been added by doddlebot'`);
          const contentHashed = crypto.createHmac('sha512', config.key).update(cont).digest('hex');
          consandra.execute(`UPDATE member_data SET hash = '${contentHashed}' WHERE id = ${dbData['id']}`);
        }
      }

      // update nickname in table
      if (dbData['nickname'] != message.member.displayName) {
        consandra.execute(`UPDATE member_data SET nickname = ? WHERE id = ${dbData['id']}`, [message.member.displayName], err3 => {
          if (err3) throw err3;
          console.log('User nickname updated');
        });
      }

      if (message.content.indexOf(config.prefix) !== 0) return;
      if (!message.member.roles.cache.has(bot.role.memberid)) {
        message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      }

      // colour stuff
      if (command === 'colour') {
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
            if (message.member.roles.cache.has(bot.role[colours[i].concat('id')])) {
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
        const per0 = args[0];
        const per1 = args[1];
        const peradded1 = [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]];
        const embed = new Client.MessageEmbed();
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
            const toRemove = ['gay', 'straight', 'bisexual', 'asexual', 'pansexual', 'female', 'male', 'lesbian', 'non binary', 'fluid', 'agender', 'hehim', 'sheher', 'theythem', 'trans', 'homoromantic', 'hetroromantic', 'biromantic', 'aromantic', 'panromantic'];
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
      }

      // end of personality stuff

      if (command === 'serverinfo') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setDescription(`**__${message.guild.name} Details__**`)
          .setThumbnail(message.guild.iconURL)
          .addField('Members', `${message.guild.memberCount - message.guild.members.cache.filter(member => {return member.user.bot}).size} Members`)
          .addField('Bots', `${message.guild.members.cache.filter(member => {return member.user.bot}).size} Bots`)
          .addField('Channels', `${message.guild.channels.cache.filter(chan => {return chan.type === 'voice'}).size} voice / ${message.guild.channels.cache.filter(chan => {return chan.type === 'text'}).size - 6} text`)
          .addField('Mods', message.guild.roles.cache.get('376873845333950477').members.map(m => {return m.user}).join(', '))
          .addField('Managers', message.guild.roles.cache.get('337016459429412865').members.map(m => {return m.user}).join(', '));
        message.channel.send({ embed });
      }

      if (command === 'colourhelp') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Colour Role Help**')
          .setDescription('This is the command to add colour to your name in doddlecord!')
          .addField('**Colour Commands**', (bot.commandLists.colour));
        message.channel.send({ embed });
      }

      if (command === 'help') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Help**')
          .setDescription('Looking for help? yes...well look below for the category you need help with!')
          .addField('**Commands**', (bot.commandLists.catogery));
        message.channel.send({ embed });
      }

      if (command === 'timehelp') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Time help**')
          .setDescription(bot.commandLists.time)
        message.channel.send({ embed });
      }

      if (command === 'roleshelp') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Personal Role Help**')
          .setDescription('Personal roles are added to give a little info on who you are to other members of doddlecord.\nThey are completely optional roles though. Make __shore__ you spell them correctly or it will not add them!')
          .addField('Use', '```d!roles [remove] Gay Hehim Artist```')
          .addField('**Identity  Roles**', (bot.identityRoles), true)
          .addField('**Sexualty Roles**', (bot.sexualtyRoles), true)
          .addField('**Romantic Roles**', (bot.romanticRoles), true)
          .addField('**Pronun Roles**', (bot.pronunRoles), true)
          .addField('**Extra Roles**', (bot.extraRoles), true)
          .addField('\u200B', '\u200B', true)
        message.channel.send({ embed });
      }

      if (command === 'extras') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Extra Help**')
          .setDescription('Just some extra commands that doddlebot can do!\n\nCommands with * means the input is requied E.G: `d!top 10`')
          .addField('**Extra Commands**', (bot.commandLists.other));
        message.channel.send({ embed });
      }

      if (command === 'ukhelplines') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('UK Helplines')
          .setDescription(bot.text.uk);
        message.channel.send({ embed });
      }

      if (command === 'ushelplines') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('USA Helplines')
          .setDescription(bot.text.us);
        message.channel.send({ embed });
      }

      if (command === 'ping') {
        const ping = Math.round(client.ws.ping);
        console.log(client.ws.ping)
        message.channel.send(`Ping is ${ping}ms`);
        logger('system' , message.author, `Ping was ${ping}ms`);
      }

      if (message.channel.name === 'secrets-for-the-mods') {
        if (command === 'send') {
          topx(message, 5, 'weekly', () => {
            const embed = new Client.MessageEmbed()
            embed.setColor(0xFEF65B)
            embed.setTitle('doddlecord\'s Top 5 of this week')
            for (var j = 0; j < 5; j++) {
              embed.addField(`#${j+1}: ${globalPlsWork[j].username}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
              message.guild.members.cache.get(globalPlsWork[j].userid).roles['add'](bot.role.top5);
            }
            channel('announcements').send({ embed });
          });
          message.channel.send('30s till weeklypoints is RESET use `d!send stop` to stop');
          setTimeout(() => {
            // need to find a way to set collum null and level too 1
            // consandra.execute('UPDATE member_data SET wkylevel, wkypoints, wkytotalpoints WHERE `, [zoneconver], {prepare: true});
            // consandra.execute('TRUNCATE TABLE weeklypoints');
            // console.log('WEEKLYPOINTS TABLE HAS BEEN TRUNCATED');
            // logger('system' , message.author, 'WEEKLYPOINTS TABLE WAS TRUNCATED');
          }, 30000)
        }
      }

      // Boo!
      if (command === 'rank') {
        if (args[0] != null) {
          consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.mentions.users.first().id}'`, (err, result) => {
            const row = result.first();
            if (result[0] != null) {
              const embed = new Client.MessageEmbed()
                .setColor(0xFEF65B)
                .setTitle(`Rank Of ${row['nickname']}`)
                .addField('Level', (row['level']))
                .addField('Points', (row['points']))
                .addField('There Next Level In', `${(row['level'] * 100) - row['points']} Points`)
                .setFooter(`Total points gained: ${row['totalpoints']}`);
              message.channel.send({ embed });
            } else { message.channel.send('can\'t find any points on this member. `d!rank` for your own rank or `d!rank @user` to get anothers users rank'); }
          });
        } else {
          const embed = new Client.MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle(`**Your Rank ${message.member.displayName}**`)
            .addField('**Level**', (dbData['level']))
            .addField('**Points**', (dbData['points']))
            .addField('Next Level In', `${(dbData['level'] * 100) - dbData['points']} Points`)
            .setFooter(`Total points gained: ${dbData['totalpoints']}`);
          message.channel.send({ embed });
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
            if ((x + 1) != (roles.length)) {
              roleArray.push('<@&' + roles[x] + '> ')
            } else {
              roleArray.push('<@&' + roles[x] + '>')
            }
          }
        }
        function count(result) {
          const row = result.first();
          for (let i = 0; i < result.rows.length; i++) { // checkes the length of the SQL result
            wordCount += result.rows[i].pointscount // adding the points
            popChannel.push(result.rows[i].channel)
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
          consandra.execute(`SELECT * FROM member_data WHERE userid = '${mentionedUser.id}'`, (err, result) => {
            if (err) {
              console.log(err)
            }
            consandra.execute('SELECT * FROM message_metadata WHERE userid = ?', [mentionedUser.id], {prepare : true, fetchSize: 25000}, (err, archive) => {
              const row = result.first();
              var timez = (row['timeorloc'] || 'Member has not set it yet');
              var mentioned = (message.client.guilds.cache.get('337013993669656586').members.cache.get(mentionedUser.id))
              const embed = new Client.MessageEmbed()
                .setColor(mentioned.displayHexColor)
                .setTitle(`${mentioned.displayName}'s Profile`, true)
                .setThumbnail(mentionedUser.displayAvatarURL())
                .setDescription('Loading...')
              message.channel.send({ embed }).then(msg => {
                count(archive)
                arrayRole(mentioned._roles)
                  
                const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.mentions.users.first().id).joinedAt}`.trim().split(/ +/g);
                const embed = new Client.MessageEmbed()
                  .setColor(mentioned.displayHexColor)
                  .setTitle(`${mentioned.displayName}'s Profile`, true)
                  .setThumbnail(mentionedUser.displayAvatarURL())
                  .addField('Rank', 'Level: ' + (row['level']) + '\nPoints: ' + (row['points']) + '\nNext Level In ' + ((row['level'] * 100) - row['points']) + ' Points' + `\nTotal points gained: ${row['totalpoints']}`, true)
                  .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}\nMost used channel: ${item}\nwith ${mf} messages`, true)
                  .addField('Time Zone', timez)
                  .addField('\u200B', '\u200B')
                  .addField('Roles', roleArray.join(''))
                  .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`);
                message.channel.send({ embed });
                msg.delete({ timeout: 1, reason: 'bot removed'})
              })
            })
          })
        } else {
          var timez = (dbData['timeorloc'] || 'You have not set a Time or location. Use d!timehelp to get started');
          const embed = new Client.MessageEmbed()
            .setColor(message.member.displayHexColor)
            .setTitle(`Your Profile ${message.member.displayName}`, true)
            .setThumbnail(message.author.displayAvatarURL())
            .setDescription('Loading...')
          message.channel.send({ embed }).then(msg => {
            consandra.execute('SELECT * FROM message_metadata WHERE userid = ?', [message.author.id], {prepare : true, fetchSize: 25000}, (err, archive) => {
              if (err) {
                console.log(err)
              }
              count(archive)
              arrayRole(message.member._roles)
              const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g);
              const embed = new Client.MessageEmbed()
                .setColor(message.member.displayHexColor)
                .setTitle(`Your Profile ${message.member.displayName}`, true)
                .setThumbnail(message.author.displayAvatarURL())
                .addField('Rank', 'Level: ' + (dbData['level']) + '\nPoints: ' + (dbData['points']) + '\nNext Level In ' + ((dbData['level'] * 100) - dbData['points']) + ' Points' + `\nTotal points gained: ${dbData['totalpoints']}`, true)
                .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}\nMost used channel: ${item}\nwith ${mf} messages`, true)
                .addField('Time Zone', timez)
                .addField('\u200B', '\u200B')
                .addField('Roles', roleArray.join(''))
                .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`);
              message.channel.send({ embed });
              msg.delete({ timeout: 1, reason: 'bot removed'})
            })
          })
        }
      }

      if (command === 'top') {
        const arg = parseInt(args[0]);
        const embed = new Client.MessageEmbed()
        if (arg > 25) {
          topx(message, 25, 'total', () => {
            embed.setColor(0xFEF65B)
            embed.setFooter('Can not be larger then 25')
            for (var j = 0; j < 25; j++) {
              embed.addField(`#${j+1}: ${globalPlsWork[j].nickname}`, `At level **${globalPlsWork[j].level}** with **${globalPlsWork[j].points}** points`);
            }
            message.channel.send({ embed });
          });
        } else if (Number.isInteger(arg)) {
          topx(message, arg, 'total', () => {
            embed.setColor(0xFEF65B)
            for (var j = 0; j < arg; j++) {
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
        message.client.guilds.cache.get('337013993669656586').members.fetch({ user, cache: false }).then(memberData => {
          console.log(memberData._roles.includes)
          if (memberData._roles.includes(bot.role.serid)) {
            message.channel.send('you already have access, if you want to remove it react with \u2705').then(msg => {
              msg.react('\u2705')
              const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id; };
              
              msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
                const reaction = collected.first();
              
                if (reaction.emoji.name === '\u2705') {
                  message.reply('Your access has been removed')
                  try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
                  role('remove', message, bot.role.serid)
                }
              }).catch(collected => {
                try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
              });
            });
          } else {
            const embed = new Client.MessageEmbed()
              .setColor(0xFEF65B)
              .setTitle('Serious chat opt in WARNING')
              .setDescription(bot.text.serious);
            message.channel.send({ embed }).then(msg => {
              setTimeout(() => {
                msg.react('\u2705')
                const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id; };
              
                msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
                  const reaction = collected.first();
                
                  if (reaction.emoji.name === '\u2705') {
                    message.reply('You now have access')
                    try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
                    role('add', message, bot.role.serid)
                  }
                }).catch(collected => {
                  try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
                });
              })
            });
          }
        })
      }
      // fuck me this need redoing lol
      if (command === 'flip') {
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
          const embed = new Client.MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('Community minecraft server running 1.14')
            .setDescription(`Join now: mc.doddlecord.com\n\nlatest IP: -----> ${ip}`)
            .setFooter('If you have connection inssues in the future, use the latest IP address');
          message.channel.send({ embed });
        });
      }

      if (command === 'test') {
        memberData(message.author.id, message.author.displayName, )
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
                consandra.execute(`UPDATE member_data SET timeorloc = ? WHERE id = ${dbData['id']}`, [zoneconver], {prepare: true});
                message.channel.send(zoneconver + ' is now set as your time or location')
              }
            }, 1000);
          } else {
            if (args[0] != null) {
              var mentionedUser = message.mentions.users.first();
              var memberData = message.guild.members.cache.get(mentionedUser.id)
              consandra.execute(`SELECT timeorloc, userid FROM member_data WHERE userid = '${mentionedUser.id}'`, (err, result) => {
                console.log(mentionedUser)
                if (mentionedUser === undefined) {
                  message.channel.send('For help type d!timehelp')
                } else if (result.rows[0].timeorloc === null) {
                  message.channel.send('Look like they may have not set a time yet')
                } else {
                  message.channel.send('For ' + memberData.displayName + ', the local time is ' + moment.tz(Date.now(), result.rows[0].timeorloc).format('hh:mmA z'))
                }
              })
            } else {
              message.channel.send('For help type d!timehelp')
            }
          }
        }
        time()
      }
    });
  });
});
