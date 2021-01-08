
// doddlebot 1.3 WiP author: Ben Hunter
const Client = require('discord.js')
const cassandra = require('cassandra-driver')
const CronJob = require('cron').CronJob

const crypto = require('crypto')
const { spawn } = require('child_process')//.spawn

const config = require('./json_files/config.json')
const bot = require('./json_files/data.json')

// Cassandra config
const consandra = new cassandra.Client({
  contactPoints: ['10.100.1.8'],
  localDataCenter: 'datacenter1',
  keyspace: 'doddlecord'
})

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
function topx(x, mode, callback) {
  let queery = '' // geddit? It's because we're all gay.
  let title = ''
  if (mode == 'total') {
    queery = 'SELECT userid, nickname, level, points, totalpoints FROM member_data'
    title = `doddlecord's top ${x} of all time`
  } else if (mode == 'weekly') {
    queery = 'SELECT userid, nickname, wkylevel, wkypoints, wkytotalpoints FROM member_data'
    title = `doddlecord's top ${x} this week`
  }

  consandra.execute(queery, {prepare: true},(err, result) => {
    var topxArray = []

    for (let i = 0; i < result.rowLength; i++) {
      if (mode == 'total') topxArray.push({userid:`${result.rows[i].userid}`, nickname:`${result.rows[i].nickname}`, level:`${result.rows[i].level}`, points:`${result.rows[i].points}`, totalpoints:`${result.rows[i].totalpoints}`})
      if (mode == 'weekly') topxArray.push({userid:`${result.rows[i].userid}`, nickname:`${result.rows[i].nickname}`, level:`${result.rows[i].wkylevel}`, points:`${result.rows[i].wkypoints}`, totalpoints:`${result.rows[i].wkytotalpoints}`})
    }
    (function(){
      if (typeof Object.defineProperty === 'function'){
        try{Object.defineProperty(Array.prototype,'sortBy',{value:sortDBdata}) }catch(e){}
      }
      if (!Array.prototype.sortBy) Array.prototype.sortBy = sortDBdata

      function sortDBdata(f){
        for (var i=this.length;i;){
          var o = this[--i]
          this[i] = [].concat(f.call(o,o,i),o)
        }
        this.sort(function(a,b){
          for (var i=0,len=a.length;i<len;++i){
            if (a[i]!=b[i]) return a[i]<b[i]?-1:1
          } return 0
        })
        for (var i=this.length;i;){
          this[--i]=this[i][this[i].length-1]
        } return this
      }
    })()

    var topxSortBy = topxArray.sortBy(function(o){ return  -o.totalpoints })
    callback(topxSortBy)
  })
}
// returns channel collection
/**
 * All the available channels
 * @param  {string} - Channel name
 * @returns {Object} - A channel object
 */
function channel(channel) {
  return client.channels.cache.get(bot.channels[channel]) // cache?
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
    if (err) console.log(err)
    console.log(data)
  })
}

consandra.connect()

const client = new Client.Client()

// Discord login, looks to see if in DEV or STABLE branch
if (__dirname.match('STABLE')) {
  client.login(config.token)
} else {
  client.login(config.DEVtoken)
  client.on('debug', e => {return console.info(e)})
}

// Discord error handleing
client.on('error', e => {return console.error(e)})
client.on('warn', e => {return console.warn(e)})

// Loads logs and sets activity
client.on('ready', () => {
  client.user.setActivity('With doddleolphin', { type: 'PLAYING' })
  console.log(`Logged in as ${client.user.username} ${bot.system.ver}`)

  const job = new CronJob('21 10 * * 0', function() {
    const serverChannels = client.guilds.cache.get('337013993669656586').channels.cache
    const Channel = serverChannels.get(bot.channels.general)
    Channel.messages.fetch(Channel.lastMessageID).then(message => {
      client.guilds.cache.get('337013993669656586').members.prune({
        days: 30, reason: 'members have not introduced them selfs within and have been offline for 7 days'
      }).then(prune => {
        logger('system', client.user, `This week, ${prune} members have been removed`)
        serverChannels.get(bot.channels.testfacility).send(`The prune this week resuted in ${prune} members being removed`)
      })

      topx(5, 'weekly', (topx) => {
        const embed = new Client.MessageEmbed()
        embed.setColor(0xFEF65B)
        embed.setTitle(`doddlecord\'s Top 5 of this week out of ${topx.lemght}`)
        for (var j = 0; j < 5; j++) {
          embed.addField(`#${j+1}: ${topx[j].nickname}`, `At level **${topx[j].level}** with **${topx[j].points}** points`)
        }
        message.guild.roles.fetch(bot.role.top5).then(roles => {
          roles.members.map(_m => {
            message.member.roles.add(bot.role.top5)
          })
        }) // I know this is grim but its the only way
        serverChannels.get(bot.channels.themods).send({ embed })
        serverChannels.get(bot.channels.themods).send(', does this look ok? Is it sunday? If everything is ok, use `d!send` to publish')
      })
    })
  })
  if (__dirname.match('STABLE')) {
    job.start()
  }
})

// New memeber procedure
// Discord login, looks to see if in DEV or STABLE branch
client.on('guildMemberAdd', member => { 
  if (member.user.tag.match('discord.gg')) {
    member.kick(member.id)
    return
  }

  logger('info' , member, `${member.user.tag} has joined ${member.guild.name}`)
})

client.on('guildMemberRemove', remember => {
  consandra.execute(`DELETE FROM member_data WHERE userid = '${remember.id}'`)
  logger('info' , remember, `${remember.user.tag} Has left ${remember.guild.name}`)
  channel('themods').send(`${remember.user.tag.slice(0, -5)} has left the server`)
})

client.on('message', message => {
  if (message.author.bot) return

  // This checks if the member had data on the db if not it will insert a new row with the members data
  var memberPromise = new Promise(function(resolve, _reject) {
    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (_err4, dbData) => {
      if (dbData.first() === null) {
        consandra.execute('INSERT INTO member_data (userid,nickname,level,points,totalpoints,score,roles,wkylevel,wkypoints,wkytotalpoints) VALUES (?,?,?,?,?,?,?,?,?,?)', [`${message.author.id}`, `${message.member.displayName}`, 1, 0, 0, 0, `${message.member._roles}`, 1, 0, 0], { prepare: true }, err => {
          if (err) {
            console.log(err)
            channel('themods').send(`There was an error with ${message.author.displayName}'s (${message.author.id}) data, doddlebot has recoved but the DB table may need checking`)
          } else { console.log('New Member Data Added To The Table'), resolve(true)}
        })
      } else {
        resolve(true)
      }
    })
  })

  memberPromise.then(function(_value) {
    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (_err4, data) => {
      const dbData = data.first()
      const args = message.content.toLowerCase().slice(config.prefix.length).trim().split(/ +/g)
      const command = args.shift().toLowerCase()
      message.content = message.content.toLowerCase()
      if (message.content === 'd!kill') {
        if (message.member.roles.cache.has(bot.role.managersjoshesid) || (message.author.id === '394424134337167360')) {
          logger('system' , message.author, `${message.author.tag} Had shutdown doddlebot')`)
          process.exit()
        }
      }

      var pattern = /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g
      var m = message.content.match(pattern)
      var count = 0
      if (!m) return 0
      for (var i = 0; i < m.length; i++) {
        if (m[i].charCodeAt(0) >= 0x4e00) {
          count += m[i].length
        } else {
          count += 1
        }
      }

      if (message.channel.type === 'dm') {
        if (command === 'data') {
          const nextDate = new Date(parseInt(dbData['dataepoch']) + 6.048e+8)
          if ( parseInt(dbData['dataepoch']) < (Date.now() - 6.048e+8)) {
            consandra.execute(`UPDATE member_data SET dataepoch = '${Date.now()}' WHERE userid = '${dbData['userid']}'`)
            const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g)
            const joinDateText = `\nYou_joined_on_${joinDateArray[0]}_${joinDateArray[1]}_${joinDateArray[2]}_${joinDateArray[3]}_at_${joinDateArray[4]}`
            logger('info', message.author, 'had requested their data')
            const dateOfPDF = new Date(parseInt(dbData['dataepoch']))

            message.channel.send('Getting your data').then(msg => {
              let gg = 1
              const loading = setInterval(() => {
                if (gg === 1) { msg.edit('Getting your data.'); gg++ } else
                if (gg === 2) { msg.edit('Getting your data..'); gg++ } else
                if (gg === 3) { msg.edit('Getting your data...'); gg = 1 }
              }, 3000)

              var cp = spawn('node', ['data', message.author.id, message.author.tag, joinDateText], {cwd:'./tools/'}, (error, _stdout, _stderr) => {
                if (error) throw error
              })
              setTimeout(() => {
                clearInterval(loading)
                message.channel.send('Your Data:', {
                  files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
                })
                const nextDate = new Date(parseInt(dbData['dataepoch']) + 6.048e+8) // The 0 there is the key, which sets the date to the epoch
                message.channel.send('The next time you can request your data is after ' + nextDate.toUTCString() + '\nIf you think anything is wrong with your PDF please don\'t hesitate to DM TechLevelZero')
              }, 30000)
            })
          } else {
            const dateOfPDF = new Date(parseInt(dbData['dataepoch']))
            message.channel.send('You have alrady requested your data this past week. The next time you can request your data is after ' + nextDate.toUTCString())
            message.channel.send(`Here is your PDF from ${dateOfPDF.toUTCString()}`, {
              files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
            })
          }
        }
      }
      if (message.channel.type === 'dm') return

      // removes or bans ads messages and bots
      if ((!message.member.roles.cache.has(bot.role.managersjoshesid) || !message.member.roles.cache.has(bot.role.modsid)) && (message.cleanContent.match('discord.gg') || message.author.tag.match('discord.gg') || message.member.displayName.match('discord.gg'))) {
        if (!message.cleanContent.match('discord.gg')) message.member.kick(message.author.id)
        message.delete(message)
        return
      }

      let ganinedpoints = 0
      if (message.content.length > 8 && !message.cleanContent.match('pls ')) {
        const pointsRandom = (Math.floor(Math.random() * 18) + 5)
        const WpointsRandom = (Math.floor(Math.random() * 22) + 9)
        const pointsJSON = { 'points':`${pointsRandom + dbData['points']}`, 'totalpoints':`${pointsRandom + dbData['totalpoints']}` }
        const wkyPointsJSON = { 'points':`${WpointsRandom + dbData['wkypoints']}`, 'totalpoints':`${WpointsRandom + dbData['wkytotalpoints']}` }
        ganinedpoints = pointsRandom

        if (dbData['level'] * 100 <= pointsJSON.points) {
          const rounedTotal = Math.round(pointsJSON.totalpoints/100) * 100
          const queries = [
            { query: `UPDATE  member_data SET level = ${dbData['level'] + 1} WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET points = 0 WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET totalpoints = ${rounedTotal} WHERE userid = '${dbData['userid']}'` }
          ]
          consandra.batch(queries, { }).then(function() { console.log('Member Leveled Up') }).catch(function(err) { console.log(err) })
          message.channel.send(`You are now level ${dbData['level'] + 1}, ${message.author}`)
        } else {
          const queries = [
            { query: `UPDATE  member_data SET points = ${pointsJSON.points} WHERE userid = '${dbData['userid']}'` },
            { query: `UPDATE  member_data SET totalpoints = ${pointsJSON.totalpoints} WHERE userid = '${dbData['userid']}'` }
          ]
          consandra.batch(queries, { }).then().catch(function(err) { console.log(err) })
        }
        if (message.member.roles.cache.has(bot.role.managersjoshesid) == message.member.roles.cache.has(bot.role.modsid)) {
          if (dbData['wkylevel'] * 100 <= wkyPointsJSON.points) {
            const rounedTotal = Math.round(wkyPointsJSON.totalpoints/100) * 100
            const queries = [
              { query: `UPDATE  member_data SET wkylevel = ${dbData['wkylevel'] + 1} WHERE userid = '${dbData['userid']}'` },
              { query: `UPDATE  member_data SET wkypoints = 0 WHERE userid = '${dbData['userid']}'` },
              { query: `UPDATE  member_data SET wkytotalpoints = ${rounedTotal} WHERE userid = '${dbData['userid']}'` }
            ]
            consandra.batch(queries, { }).then(function() { console.log('[weekly] Member Leveled Up') }).catch(function(err) { console.log(err) })
          } else {
            const queries = [
              { query: `UPDATE  member_data SET wkypoints = ${wkyPointsJSON.points} WHERE userid = '${dbData['userid']}'` },
              { query: `UPDATE  member_data SET wkytotalpoints = ${wkyPointsJSON.totalpoints} WHERE userid = '${dbData['userid']}'` }
            ]
            consandra.batch(queries, { }).then().catch(function(err) { console.log(err) })
          }
        }
      }
      // Adds server metadata to the table, server stats can be shown with this data
      consandra.execute('INSERT INTO message_metadata (id,userid,username,channel,channelid,date,wordcount,pointscount) VALUES (uuid(),?,?,?,?,?,?,?)', [message.author.id, message.member.displayName, message.channel.name, message.channel.id, Date.now(), count, ganinedpoints], { prepare: true }, err => {
        if (err) throw err
        console.log('Message Metadata Archived')
      })

      if (!message.member.roles.cache.get(bot.role.memberid)) {
        const score = []
        const cont = message.cleanContent.toLowerCase()
        function autoMember() {
          for (var word in bot.lookup) {
            if (cont.indexOf(word) != -1) {
              score.push(bot.lookup[word])
            }
          }
        }
        autoMember()
        var sum = score.reduce(function(a, b){
          return a + b
        }, 0)
        if (sum >= 1000) {
          const addedRoles = []
          for (const roleMeme in bot.newRoles) {
            if (cont.indexOf(roleMeme) !== -1 && roleMeme !== 'artist') {
              message.member.roles.add(bot.role[roleMeme.replace('/','')+'id'])
              addedRoles.push(roleMeme)
            }
          }

          if (addedRoles.length > 0) {
            message.channel.send(`Added ${addedRoles.join(', ')} role(s) since it looks like you want them.`)
          }

          message.member.roles.add(bot.role.memberid)
          message.channel.send( `I've made you a member! If you haven't please read the ${channel('rules')}. Also to pick your colour and personal roles go to ${channel('funwithbots')}`)
          logger('info' , message.author, `${message.author.tag} had been added by doddlebot'`)
          const contentHashed = crypto.createHmac('sha512', config.key).update(cont).digest('hex')
          consandra.execute(`UPDATE member_data SET hash = '${contentHashed}' WHERE userid = ${dbData['userid']}`)
        }
      }

      // update nickname in table
      if (dbData['nickname'] != message.member.displayName) {
        consandra.execute('UPDATE member_data SET nickname=? WHERE userid=?', [message.member.displayName, message.author.id], { prepare: true }, err3 => {
          if (err3) throw err3
          console.log('User nickname updated')
        })
      }

      if (message.content.indexOf(config.prefix) !== 0) return

      if (!message.member.roles.cache.has(bot.role.memberid)) {
        message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`))
      }

      // personality stuff
      if (command === 'roles') {
        const per0 = args[0]
        const per1 = args[1]
        const peradded1 = [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]]
        const embed = new Client.MessageEmbed()
        const changed = []
        let state = 'NA'
        embed.setColor(0xFEF65B)

        const colours = ['lime', 'rose', 'blue', 'violet', 'aqua', 'yellow']
        
        function colourRemove() {
          for (const index in colours) {
            const colour = colours[index]
            if (message.member.roles.cache.has(bot.role[bot.newRoles[colour]])) {
              message.member.roles.remove(bot.role[bot.newRoles[colour]])
            }
          }
        }
        
        for (const index in colours) {
          if (peradded1.toString().match(colours[index])) {
            colourRemove()
          }
        }
        
        if (per0 === 'remove') {
          embed.setTitle('Roles removed:')
          state = 'removed'
        } else {
          embed.setTitle('Roles added:')
          state = 'added'
          peradded1.unshift('added')
        }
        if (per1 === 'all') {
          if (per0 === 'remove') {
            const toRemove = ['gay', 'straight', 'bisexual', 'asexual', 'pansexual', 'female', 'male', 'lesbian', 'non binary', 'genderfluid', 'agender', 'hehim', 'sheher', 'theythem', 'trans', 'queer', 'homoromantic', 'heteroromantic', 'biromantic', 'aromantic', 'panromantic', 'karaokeid', 'study']
            for (let i = 0; i < toRemove.length; i++) {
              message.member.roles.remove(bot.role[toRemove[i].concat('id')])
            }
            message.reply('All personal roles have been removed')
          }
        } else {
          let mark = false
          for (const key in bot.newRoles) {
            // It's running for every one found
            if (peradded1.indexOf(key) != -1) {
              mark = true
              changed.push(`<@&${bot.role[bot.newRoles[key]]}>`)
              // Set role
              if (per0 === 'remove') {
                message.member.roles.remove(bot.role[bot.newRoles[key]])
              } else {
                message.member.roles.add(bot.role[bot.newRoles[key]]).then(response => {
                  console.log(response.roles.cache)
                })
                embed.setDescription(key)
              }
            }
          }
          // r/OutOfTheLoop
          if (!mark) {
            message.channel.send(`${message.author} example: d!roles gay male memedealer [For help type d!roleshelp]`)
          } else {
            embed.setDescription(changed.join('\n'))
            message.channel.send({ embed })
            logger('info' , message.author, `${message.author.tag} has ${state} ${peradded1.slice(1)}`)
          }
        }
      }
      // end of personality stuff

      if (command === 'serverinfo') { // needs abit of a refresh
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setDescription(`**__${message.guild.name} Details__**`)
          .setThumbnail(message.guild.iconURL)
          .addField('Members', `${message.guild.memberCount - message.guild.members.cache.filter(member => {return member.user.bot}).size} Members`)
          .addField('Bots', `${message.guild.members.cache.filter(member => {return member.user.bot}).size} Bots`)
          .addField('Channels', `${message.guild.channels.cache.filter(chan => {return chan.type === 'voice'}).size} voice / ${message.guild.channels.cache.filter(chan => {return chan.type === 'text'}).size - 6} text`)
          .addField('Mods', message.guild.roles.cache.get('376873845333950477').members.map(m => {return m.user}).join(', '))
          .addField('Managers', message.guild.roles.cache.get('337016459429412865').members.map(m => {return m.user}).join(', '))
        message.channel.send({ embed })
      }

      if (command === 'help') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Help**')
          .setDescription('Looking for help? yes...well look below for the category you need help with!')
          .addField('**Commands**', (bot.commandLists.catogery))
        message.channel.send({ embed })
      }

      if (command === 'roleshelp') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Role Help**')
          .setDescription('Roles are added to give a little info on who you are to other members of doddlecord.\nThey are completely optional roles though. Make sure you spell them correctly or it will not add them!')
          .addField('Use', '```d!roles [remove] Gay Hehim Artist```')
          .addField('**Identity  Roles**', (bot.identityRoles), true)
          .addField('**Sexuality Roles**', (bot.sexualityRoles), true)
          .addField('**Romantic Roles**', (bot.romanticRoles), true)
          .addField('**Pronoun Roles**', (bot.pronounRoles), true)
          .addField('**Extra Roles**', (bot.extraRoles), true)
          .addField('**Colour Roles**', (bot.colourRoles), true)
          .addField('Mentionable Roles', (bot.mentionableRoles)) 
          .addField('\u200B', '\u200B', true)
          .setFooter('*Roles are mentionable by everyone!')
        message.channel.send({ embed })
      }

      if (command === 'extras') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Extra Help**')
          .setDescription('Just some extra commands that doddlebot can do!\n\nCommands with * means the input is required E.G: `d!top 10`')
          .addField('**Extra Commands**', (bot.commandLists.other))
        message.channel.send({ embed })
      }

      if (command === 'ukhelplines') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('UK Helplines')
          .setDescription(bot.text.uk)
        message.channel.send({ embed })
      }

      if (command === 'ushelplines') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('USA Helplines')
          .setDescription(bot.text.us)
        message.channel.send({ embed })
      }

      if (command === 'ping') {
        const ping = Math.round(client.ws.ping)
        message.channel.send(`Ping is ${ping}ms`)
        logger('system' , message.author, `Ping was ${ping}ms`)
      }

      if (message.channel.name === 'secrets-for-the-mods') {
        if (command === 'send') {
          topx(5, 'weekly', function(topxArray) {
            const embed = new Client.MessageEmbed()
            embed.setColor(0xFEF65B)
            embed.setTitle('doddlecord\'s Top 5 of this week')
            for (var j = 0; j < 5; j++) {
              embed.addField(`#${j+1}: ${topxArray[j].nickname}`, `At level **${topxArray[j].level}** with **${topxArray[j].points}** points`)
            }
            const top5remove = message.guild.roles.cache.get(bot.role.top5).members.map(m=>{return m.user})
            setTimeout(() => {
              for (var k = 0; k < top5remove.length; k++) {
                // need to fix cache issues
                message.guild.members.cache.get(top5remove[k].id).roles['remove'](bot.role.top5)
              }
              for (var g = 0; g < 5; g++) {
                // add top 5 role
                console.log(topxArray[g].userid)
                //message.guild.members.cache.get(topxArray[g].userid).roles.add(bot.role.top5)
              }
            }, 1000)
            channel('announcements').send({ embed })
          })
          message.channel.send('30s till weeklypoints is RESET use `d!kill` to stop')

          setTimeout(() => {
            consandra.eachRow('SELECT userid, wkytotalpoints FROM member_data', (_n, row) => {
              if (row.wkytotalpoints > 1) {
                consandra.execute(`UPDATE member_data SET wkylevel = 1, wkypoints = 0, wkytotalpoints = 0 WHERE userid = '${row.userid.replace(/(')/g, '')}' IF EXISTS`)
              }
            })
            console.log('Weekly points reset\n')
          }, 10000)
        }
      }

      if (command === 'profile') {
        var roleArray = []
        var wordCount = 0
        var popChannel = []
        let mf = 1
        let m = 0
        let rank = 1
        let item

        function ordinal(i) {
          var j = i % 10, k = i % 100

          if (j == 1 && k != 11) { return i + 'st' }
          if (j == 2 && k != 12) { return i + 'nd' }
          if (j == 3 && k != 13) { return i + 'rd' }
          return i + 'th'
        }

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
          const row = result.first()
          for (let i = 0; i < result.rows.length; i++) { // checkes the length of the SQL result
            wordCount += result.rows[i].pointscount // adding the points
            popChannel.push(result.rows[i].channel)
          }
          for (let i=0; i<popChannel.length; i++)
          {
            for (let j=i; j<popChannel.length; j++)
            {
              if (popChannel[i] == popChannel[j])
                m++
              if (mf<m)
              {
                mf=m
                item = popChannel[i]
              }
            }
            m=0
          }
        }

        if (args[0] != null) {

          if (message.mentions.users.first() === undefined) return message.channel.send('That is not a member, usages: `d!profile [@member]`')
          var mentionedUser = message.mentions.users.first()
          topx(message.guild.memberCount, 'total', (topx) => {
            rank += topx.map(function(result) { return result.userid}).indexOf(mentionedUser.id)
          })
          consandra.execute(`SELECT * FROM member_data WHERE userid = '${mentionedUser.id}'`, (err, result) => {
            if (err) console.log(err)
            consandra.execute('SELECT * FROM message_metadata WHERE userid = ?', [mentionedUser.id], {prepare : true, fetchSize: 25000}, (_err, archive) => {
              const row = result.first()
              if (row == null) return message.channel.send('Can not find a profile on this member.')
              var timez = (row['timeorloc'] || 'Member has not set it yet')
              var mentioned = (message.client.guilds.cache.get('337013993669656586').members.cache.get(mentionedUser.id))
              const embed = new Client.MessageEmbed()
                .setColor(mentioned.displayHexColor)
                .setTitle(`${mentioned.displayName}'s Profile`, true)
                .setThumbnail(mentionedUser.displayAvatarURL())
                .setDescription('Loading...')
              message.channel.send({ embed }).then(msg => {
                count(archive)
                arrayRole(mentioned._roles)

                const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.mentions.users.first().id).joinedAt}`.trim().split(/ +/g)
                const embed = new Client.MessageEmbed()
                  .setColor(mentioned.displayHexColor)
                  .setTitle(`${mentioned.displayName}'s Profile`, true)
                  .setThumbnail(mentionedUser.displayAvatarURL())
                  .addField('Rank',  `Position: ${ordinal(rank)}` + '\nLevel: ' + (row['level']) + '\nPoints: ' + (row['points']) + '\nNext Level In ' + ((row['level'] * 100) - row['points']) + ' Points' + `\nTotal points gained: ${row['totalpoints']}`, true)
                  .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}\nMost used channel: ${item}\nwith ${mf} messages`, true)
                  .addField('\u200B', '\u200B')
                  .addField('Roles', roleArray.join(''))
                  .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`)
                message.channel.send({ embed })
                msg.delete({ timeout: 1, reason: 'bot removed'})
              })
            })
          })
        } else {
          topx(message.guild.memberCount, 'total', (topx) => {
            rank += topx.map(function(result) { return result.userid}).indexOf(message.author.id)
          })
          var timez = (dbData['timeorloc'] || 'You have not set a Time or location. Use d!timehelp to get started')
          const embed = new Client.MessageEmbed()
            .setColor(message.member.displayHexColor)
            .setTitle(`Your Profile ${message.member.displayName}`, true)
            .setThumbnail(message.author.displayAvatarURL())
            .setDescription('Loading...')
          message.channel.send({ embed }).then(msg => {
            consandra.execute('SELECT * FROM message_metadata WHERE userid = ?', [message.author.id], {prepare : true, fetchSize: 25000}, (err, archive) => {
              if (err) console.log(err)
              count(archive)
              arrayRole(message.member._roles)
              const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g)
              const embed = new Client.MessageEmbed()
                .setColor(message.member.displayHexColor)
                .setTitle(`Your Profile ${message.member.displayName}`, true)
                .setThumbnail(message.author.displayAvatarURL())
                .addField('Rank', `Position: ${ordinal(rank)}` + '\nLevel: ' + (dbData['level']) + '\nPoints: ' + (dbData['points']) + '\nNext Level In ' + ((dbData['level'] * 100) - dbData['points']) + ' Points' + `\nTotal points gained: ${dbData['totalpoints']}`, true)
                .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}\nMost used channel: ${item}\nwith ${mf} messages`, true)
                .addField('\u200B', '\u200B')
                .addField('Roles', roleArray.join(''))
                .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`)
              message.channel.send({ embed })
              msg.delete({ timeout: 1, reason: 'bot removed'})
            })
          })
        }
      }

      if (command === 'top') {
        const arg = parseInt(args[0])
        const embed = new Client.MessageEmbed()
        if (arg > 25) {
          topx(25, 'total', (topx) => {
            embed.setTitle(`Top ${arg} out of ${topx.length} members`)
            embed.setColor(0xFEF65B)
            embed.setFooter('Can not be larger then 25')
            for (var j = 0; j < 25; j++) {
              embed.addField(`#${j+1}: ${topx[j].nickname}`, `At level **${topx[j].level}** with **${topx[j].points}** points`)
            }
            message.channel.send({ embed })
          })
        } else if (Number.isInteger(arg)) {
          topx(arg, 'total', (topx) => {
            console.log(topx)
            embed.setColor(0xFEF65B)
            for (var j = 0; j < arg; j++) {
              embed.addField(`#${j+1}: ${topx[j].nickname}`, `At level **${topx[j].level}** with **${topx[j].points}** points`)
            }
            embed.setTitle(`Top ${arg} out of ${topx.length} members`)
            message.channel.send({ embed })
          })
        } else {
          message.channel.send('usage: d!top [number] No higher then 25')
        }
      }

      if (command === 'serious') {
        const user = message.author.id
        if (message.member._roles.includes(bot.role.serid)) {
          message.channel.send('you already have access, if you want to remove it react with \u2705').then(msg => {
            msg.react('\u2705')
            const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }

            msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
              const reaction = collected.first()

              if (reaction.emoji.name === '\u2705') {
                message.reply('Your access has been removed')
                try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
                message.member.roles.remove(bot.role.serid)
              }
            }).catch(_collected => {
              try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
            })
          })
        } else {
          const embed = new Client.MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('Serious chat opt in WARNING')
            .setDescription(bot.text.serious)
          message.channel.send({ embed }).then(msg => {
            setTimeout(() => {
              msg.react('\u2705')
              const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }

              msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
                const reaction = collected.first()

                if (reaction.emoji.name === '\u2705') {
                  message.reply('You now have access')
                  try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
                  message.member.roles.add(bot.role.serid)
                }
              }).catch(_collected => {
                try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
              })
            })
          })
        }
      }

      if (command === 'discord') {
        if (message.channel.id === '342823617333166080') {
          const embed = new Client.MessageEmbed()
            .setTitle('Discord ToS')
            .setThumbnail("https://discord.com/assets/2c21aeda16de354ba5334551a883b481.png")
            .setColor(0x7289DA)
            .setDescription('We follow the Terms of services set out by discord strictly with no exceptions.\nYou can find out more here: https://discord.com/terms')
          message.channel.send({ embed })
        }
      }

      if (command === 'welcomemsg') {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('**Welcome to doddlecord!**')
          .setDescription(bot.text.welcomemsg)
          .addField('\u200B', '**Welcome to**')
          // .setImage("https://cdn.discordapp.com/attachments/400622421591326720/732977360269344818/lowresdoddlecord.PNG")
        message.channel.send({ embed })
      }
 
      if (command === 'rules') {
          const embed = new Client.MessageEmbed()
            embed.setColor(0xFEF65B)
            embed.setTitle(`**Rules**`)
            // .setDescription("     ")
            embed.addField("Please do", 'Use the correct channels when sending messages, and think before @ing, or DMing a member')
            embed.addField("Don't be", 'racist, homophobic, transphobic, antisemitic or generally disrespectful')
            embed.addField("Don't post", 'NSFW (Not Safe For Work), NSFL (Not Safe For Life), and lewd content. Advertising other discord server is strictly NOT alowed (Please DM a manager josh about server Advertising)')
            embed.addField("Serious channel", '[This is an opt-in channel use d!serious for more info]\nWhen using the serious channel please be aware that some members may find certain topics triggering. Also remember that this chat is not a replacement for any kind of support you may have in place/need. Always talk to your GP or therapist if you are experiencing issues with your mental health. There is always someone to help you.')
            embed.addField('Allowed', 'Self promoteion is alowed in the related channels but do not spam, Swearing is alowed so long as it is not too much or directed at someone with the intention of causing offense/upset , ')
          message.channel.send({ embed })    
      }
    })
  })
})
