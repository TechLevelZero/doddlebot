
// doddlebot 1.3 WiP author: Ben Hunter
const Client = require('discord.js')
const cassandra = require('cassandra-driver')
const CronJob = require('cron').CronJob

const crypto = require('crypto')
const { spawn } = require('child_process')//.spawn

const config = require('./json_files/config.json')
const bot = require('./json_files/data.json')
const { promises } = require('dns')

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
 * @typedef {Array<objects>} topx
 * @property {string} userid
 * @property {string} nickname
 * @property {number} level
 * @property {number} points
 * @property {number} totalpoint
 */

/**
 * Gets the top x users, excluding mods
 * @param  {number} x - The number of users you want to retrive 
 * @param  {string} mode - total or weekly
 * @returns {topx} - Returns orderd array of members by totalpoint
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

/**
 * All the available channels
 * @param  {string} - Channel name
 * @returns {Collection} A channel object
 */
function channel(channel_name) {
  return client.channels.cache.get(bot.channels[channel_name])
}

/**
 * loggerSQL function
 * 
 * @param  {string} type - Type of log [system, info, error]
 * @param  {object} member - Members's discord js collection.
 * @param  {string} data - Text you want to log.
 */
function logger(type, member, data) {
  consandra.execute('INSERT INTO logger (id,type,userid,message,date) VALUES (uuid(), ?, ?, ?, ?)', [ type, member.id, data, Date.now()], { prepare: true }, err => {
    if (err) console.log(err)
    console.log(data)
  })
}

consandra.connect()

const client = new Client.Client()

/** 
 * Discord login, looks to see if in DEV or STABLE branch
 * Checks to see if in STABLE or INDEV and picks the corospoinding token
 */
if (__dirname.match('STABLE')) {
  client.login(config.token)
} else {
  client.login(config.DEVtoken)
  client.on('debug', e => {return console.info(e)})
}

// Discord error handleing
client.on('error', e => {return console.error(e)})
client.on('warn', e => {return console.warn(e)})

/**  Loads logs and sets activity. Also starts a cron job for the weekly-ish top 5 */
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
        })
        serverChannels.get(bot.channels.themods).send({ embed })
        serverChannels.get(bot.channels.themods).send(', does this look ok? Is it sunday? If everything is ok, use `d!send` to publish')
      })
    })
  })
  if (__dirname.match('STABLE')) {
    job.start()
  }
})

/** @event guildMemberAdd- Whene a member joins their username is checked for a invite link. */ 
// need to add a few more to the list
client.on('guildMemberAdd', member => { 
  if (member.user.tag.match('discord.gg')) {
    member.kick(member.id)
    return
  }
  logger('info' , member, `${member.user.tag} has joined ${member.guild.name}`)
})

/** @event guildMemberRemove - Removes member data from the database. */
// need to set up removele of there member ID from metadata archive
client.on('guildMemberRemove', remember => {
  consandra.execute(`DELETE FROM member_data WHERE userid = '${remember.id}'`)
  logger('info' , remember, `${remember.user.tag} Has left ${remember.guild.name}`)
  channel('themods').send(`${remember.user.tag.slice(0, -5)} has left the server`)
})

/** @event message - Trigers when messages is sent. */
client.on('message', message => {
  /** @namespace MessageEvent */
  // if a bot send a message it is ingnored from the outset
  if (message.author.bot) return

  /**
   * Member data Promise 
   * @param {resolve}
   * @param {_reject}
   * @description Checks wether the author has member data in the datebase, if not they are added to the datebase here and the message is rejected.
   * @returns {dbdata} Array of the author's member data.
   * @memberof MessageEvent
   */
  const memberPromise = new Promise(function(resolve, _reject) {
    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (_err4, dbData) => {
      if (dbData.first() === null) {
        consandra.execute('INSERT INTO member_data (userid,nickname,level,points,totalpoints,score,roles,wkylevel,wkypoints,wkytotalpoints) VALUES (?,?,?,?,?,?,?,?,?,?)', [`${message.author.id}`, `${message.member.displayName}`, 1, 0, 0, 0, `${message.member._roles}`, 1, 0, 0], { prepare: true }, err => {
          if (err) {
            console.log(err)
            _reject('error in member data')
            channel('themods').send(`There was an error with ${message.author.displayName}'s (${message.author.id}) data, doddlebot has recoved but the DB table may need checking`)
          } else { 
            console.log('New Member Data Added To The Table')
            resolve(dbData)
          }
        })
      } else {
        resolve(dbData)
      }
    })
  })

   /**
    * MemberPromise return
    * @param {dbdata} data
    * @param {string|boolean} nope
    * @memberof MessageEvent
    */
  memberPromise.then(function(data, nope) {
    if (nope === 'error in member data') return

    /**
     * @typedef {object} dbdata - An object of the message author's data.
     * 
     * @property {string} userid
     * @property {string} nickname
     * @property {string} hash
     * @property {number} score
     * @property {number} level
     * @property {number} point
     * @property {number} totalpoints
     * @property {number} wkylevel
     * @property {number} wkypoints
     * @property {number} wkytotalpoints
     * @property {boolean} member
     * @property {string} roles
     * @deprecated {string} dataepoch, {string} timeorloc, {string} ticketvotes, {number} wkylevelv2
     * @memberof MessageEvent
     */

    /**
     * @const {dbdata} dbData - Message author's database data
     * @see dbdata
     * @memberof MessageEvent
     */
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

    /**
     * DataPDF allows users to request there data from doddlebot in a nice formated PDF
     * 
     * @version 1.3
     * @deprecated Will be getting a rework in 1.5 or in the move to TypeScript
     * @memberof MessageEvent
     */

    // if (message.channel.type === 'dm') {
    //   if (command === 'data') {
    //     const nextDate = new Date(parseInt(dbData['dataepoch']) + 6.048e+8)
    //     if ( parseInt(dbData['dataepoch']) < (Date.now() - 6.048e+8)) {
    //       consandra.execute(`UPDATE member_data SET dataepoch = '${Date.now()}' WHERE userid = '${dbData['userid']}'`)
    //       const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g)
    //       const joinDateText = `\nYou_joined_on_${joinDateArray[0]}_${joinDateArray[1]}_${joinDateArray[2]}_${joinDateArray[3]}_at_${joinDateArray[4]}`
    //       logger('info', message.author, 'had requested their data')
    //       const dateOfPDF = new Date(parseInt(dbData['dataepoch']))

    //       message.channel.send('Getting your data').then(msg => {
    //         let gg = 1
    //         const loading = setInterval(() => {
    //           if (gg === 1) { msg.edit('Getting your data.'); gg++ } else
    //           if (gg === 2) { msg.edit('Getting your data..'); gg++ } else
    //           if (gg === 3) { msg.edit('Getting your data...'); gg = 1 }
    //         }, 3000)

    //         var cp = spawn('node', ['data', message.author.id, message.author.tag, joinDateText], {cwd:'./tools/'}, (error, _stdout, _stderr) => {
    //           if (error) throw error
    //         })
    //         setTimeout(() => {
    //           clearInterval(loading)
    //           message.channel.send('Your Data:', {
    //             files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
    //           })
    //           const nextDate = new Date(parseInt(dbData['dataepoch']) + 6.048e+8) // The 0 there is the key, which sets the date to the epoch
    //           message.channel.send('The next time you can request your data is after ' + nextDate.toUTCString() + '\nIf you think anything is wrong with your PDF please don\'t hesitate to DM TechLevelZero')
    //         }, 30000)
    //       })
    //     } else {
    //       const dateOfPDF = new Date(parseInt(dbData['dataepoch']))
    //       message.channel.send('You have alrady requested your data this past week. The next time you can request your data is after ' + nextDate.toUTCString())
    //       message.channel.send(`Here is your PDF from ${dateOfPDF.toUTCString()}`, {
    //         files: [`./tmp/${message.author.tag} [${message.author.id}].pdf`],
    //       })
    //     }
    //   }
    // }
    if (message.channel.type === 'dm') return

    /** Removes discord ads messages and kicks members with discord.gg links in there name */
    if ((!message.member.roles.cache.has(bot.role.managersjoshesid) || !message.member.roles.cache.has(bot.role.modsid)) && (message.cleanContent.match('discord.gg') || message.author.tag.match('discord.gg') || message.member.displayName.match('discord.gg'))) {
      if (!message.cleanContent.match('discord.gg')) message.member.kick(message.author.id)
      message.delete(message)
      return
    }

    /**
     * Points System, genorates a random number between 5 and 22 and adds it too totalpoints in the author member data
     * @version 2.1
     * @memberof MessageEvent
     */

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

    /** Adds author's message metadata to the table, server stats can be shown with this data */
    consandra.execute('INSERT INTO message_metadata (id,userid,username,channel,channelid,date,wordcount,pointscount) VALUES (uuid(),?,?,?,?,?,?,?)', [message.author.id, message.member.displayName, message.channel.name, message.channel.id, Date.now(), count, ganinedpoints], { prepare: true }, err => {
      if (err) throw err
      console.log('Message Metadata Archived')
    })

    /** 
     * AutoMember
     * @version 2.0.1
     * 
     * @desc If user is not a member this checks there messages against a word bank and if a messages hit over 1000 they are automatically added as a member.
     * @memberof MessageEvent
     */
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

    /**
     * Updates the author's nickname in the table
     * 
     * @memberof MessageEvent
     */
    if (dbData['nickname'] != message.member.displayName) {
      consandra.execute('UPDATE member_data SET nickname=? WHERE userid=?', [message.member.displayName, message.author.id], { prepare: true }, err3 => {
        if (err3) throw err3
        console.log('User nickname updated')
      })
    }
    // returs if the prefix is not at the start of the message.
    if (message.content.indexOf(config.prefix) !== 0) return

    // doddlebot can not be used if you are not a member.
    if (!message.member.roles.cache.has(bot.role.memberid)) {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`))
    }

    /** 
     * This is the roles command allowing users to add and remove roles via the bot.
     * @namespace roles 
     */
    if (command === 'roles') {

      /**
       * Arrays the arguments for roles so for loops can be used
       * @type {Array<string>}
       * @memberof roles
       */
      const peradded1 = [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]]
      const embed = new Client.MessageEmbed()
      const changed = []
      let state = 'NA'
      embed.setColor(0xFEF65B)

      /**
       * Array of colours avalabme on doddlecord
       * @type {Array<string>}
       * @memberof roles
       */
      const colours = ['lime', 'rose', 'blue', 'violet', 'aqua', 'yellow']

      /**
       * @function colourRemove
       * @description Checks thought the avablbale colours and see if the member hads a colour role and removes it when ran.
       * @see colour
       * @memberof roles
       */
      function colourRemove() {
        for (const index in colours) {
          const colour = colours[index]
          if (message.member.roles.cache.has(bot.role[bot.newRoles[colour]])) {
            message.member.roles.remove(bot.role[bot.newRoles[colour]])
          }
        }
      }
      
      /**
       * if a colour is found in the args, then colourRemove() is ran.
       * @see colourRemove
       * @memberof roles
       */
      for (const index in colours) {
        if (peradded1.toString().match(colours[index])) {
          colourRemove()
        }
      }
      
      if (args[0] === 'remove') {
        embed.setTitle('Roles removed:')
        state = 'removed'
      } else {
        embed.setTitle('Roles added:')
        state = 'added'
        peradded1.unshift('added')
      }
      if (args[1] === 'all') {
        if (args[0] === 'remove') {
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
            if (args[0] === 'remove') {
              message.member.roles.remove(bot.role[bot.newRoles[key]])
            } else {
              message.member.roles.add(bot.role[bot.newRoles[key]]).then(response => {
                console.log(response.roles.cache)
              })
              embed.setDescription(key)
            }
          }
        }
        /**
         * @todo need to redo the fail condision for roles
         * @memberof roles
         */
        if (!mark) {
          message.channel.send(`${message.author} example: d!roles gay male memedealer [For help type d!roleshelp]`)
        } else {
          embed.setDescription(changed.join('\n'))
          message.channel.send({ embed })
          logger('info' , message.author, `${message.author.tag} has ${state} ${peradded1.slice(1)}`)
        }
      }
    }

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
        .setTitle('Role Help')
        .setDescription('Roles are added to give a little info on who you are to other members of doddlecord.\nThey are completely optional roles though. Make sure you spell them correctly or it will not add them!')
        .addField('Use', '```d!roles [remove] Gay Hehim Artist```')
        .addField('Identity  Roles', (bot.identityRoles), true)
        .addField('Sexuality Roles', (bot.sexualityRoles), true)
        .addField('Romantic Roles', (bot.romanticRoles), true)
        .addField('Pronoun Roles', (bot.pronounRoles), true)
        .addField('Catch all Roles', (bot.question), true)
        .addField('Colour Roles', (bot.colourRoles), true)
        .addField('Mentionable Roles', (bot.mentionableRoles), true)
        .addField('Extra Roles', (bot.extraRoles), true)
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
              message.guild.members.cache.get(topxArray[g].userid).roles.add(bot.role.top5)
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
    /** @namespace Profile */
    if (command === 'profile') {
      var roleArray = []
      var wordCount = 0
      var popChannel = []
      var channelByPop = {}
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
        console.log('start AR')
        for (var x = 0; x < roles.length; x++) {
          if ((x + 1) != (roles.length)) {
            roleArray.push('<@&' + roles[x] + '> ')
          } else {
            roleArray.push('<@&' + roles[x] + '>')
          }
        }
        console.log('finish AR')
      }

      function count(result) {
        console.log('start count')
        const channelIds = message.guild.channels.cache.filter(chan => {return chan.type === 'text'}).map(channel => {return channel.id})
        
        for (let i = 0; i < result.rowLength; i++) {
          channelByPop[result.rows[i].channel_id] = 0
        }

        for (let i = 0; i < result.rowLength; i++) { // checkes the length of the SQL result

          wordCount += result.rows[i].word_count // adding the points
          // popChannel.push(result.rows[i].channel_id)
          channelByPop[result.rows[i].channel_id] = (channelByPop[result.rows[i].channel_id] += 1)
        }
        console.log(result)
        for (var i = 0; i < result.rows.length; i++) {
          channelByPop[popChannel[i]] =+ 1
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
          consandra.execute('SELECT * FROM message_metadata_v2 WHERE user_id = ?', [mentionedUser.id], {prepare : true, fetchSize: 250000}, (_err, archive) => {
            const row = result.first()
            console.log(archive)
            if (row == null) return message.channel.send('Can not find a profile on this member.')

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
                .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}`, true) //\nMost used channel: ${item}\nwith ${mf} messages
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
        const embed = new Client.MessageEmbed()
          .setColor(message.member.displayHexColor)
          .setTitle(`Your Profile ${message.member.displayName}`, true)
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription('Loading...')
        message.channel.send({ embed }).then(msg => {
          consandra.execute('SELECT * FROM message_metadata_v2 WHERE user_id = ?', [message.author.id], {prepare : true, fetchSize: 250000}, (err, archive) => {
            if (err) console.log(err)
            count(archive)
            arrayRole(message.member._roles)
            const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g)
            const embed = new Client.MessageEmbed()
              .setColor(message.member.displayHexColor)
              .setTitle(`Your Profile ${message.member.displayName}`, true)
              .setThumbnail(message.author.displayAvatarURL())
              .addField('Rank', `Position: ${ordinal(rank)}` + '\nLevel: ' + (dbData['level']) + '\nPoints: ' + (dbData['points']) + '\nNext Level In ' + ((dbData['level'] * 100) - dbData['points']) + ' Points' + `\nTotal points gained: ${dbData['totalpoints']}`, true)
              .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}`, true) // \nMost used channel: ${item}\nwith ${mf} messages`, true)
              .addField('\u200B', '\u200B')
              .addField('Roles', roleArray.join(''))
              .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`)
            message.channel.send({ embed })
            msg.delete({ timeout: 1, reason: 'bot removed'})
          })
        })
      }
    }

    // someone is going to have to spellcheck this shit lol

    // if (command === 'stats') {
    //   //////////////////////////////////////////////////////////////
    //   /// stats command to see member or channel stats and usage ///
    //   //////////////////////////////////////////////////////////////

    //   function channelStats(id) {
        
    //   }

    //   function memberStats(id) {

    //   }

    //   if (args[0] == undefined) {
    //     // this Default to the channel it was Initialised in.
    //     channelStats(message.channel.id)
    //   }

    //   if (!message.mentions.users.first() == undefined) {
    //     // gets member results
    //     memberStats(message.mentions.users.first().id)
    //   }

    //   if (args[0].match(/([<#,0-9,>])/g)) {
    //     // gets channel Mention
    //     channelStats(args[0].replace(/([0-9])/g))
    //   }
    // }
    
    // This is the ticket comand
    if (command === 'ticket' || command === 'tickets') {

      let ticket_no = args[0].slice(1)
      // embed when opening a ticket
      function ticketEmbed(contentHashed) {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('Your ticket ID is: ' + contentHashed)
          .setDescription('To fill in this ticket, see the commmands below\n\n`d!ticket #' + contentHashed + ' title [your title]` to set the title.\n`d!ticket #' + contentHashed +' description [your description]` to set the description.')
          .setFooter('Both a title and a description need to be given to be a valid ticket.\nYou dont need to use the square brackits [] in your title or description')
        message.channel.send({ embed })
      }

      function list_v2(msg, JSON, page, react, listLength, callback) {
        const pages = (Math.ceil(JSON.list.length / listLength)) // Returns how many page is need to show all the tickets with a max of 5 tickets per page
        let embed = new Client.MessageEmbed().setColor(JSON.colour || 0xFEF65B).setTitle(JSON.title)
        let metadata = ''

        if (Number.isInteger(Number(page))) {
          if (page > pages || page <= 0) {
            if (react) return
            return msg.channel.send('Page ' + page + ' does not exsist')
          }
          for (let i = 0; i < (page * listLength) - listLength; i++) {
            JSON.list.shift()
          }
        } else if (page != undefined) {
          msg.channel.send('Page given is not a number')
        }

        if (JSON.description != undefined ) {
          if (JSON.description != '') embed.setDescription(JSON.description)
        }

        for (var index = 0; index < JSON.list.length; index++) {
          let attachment = ''
          if (index == listLength) break
          if (args[1] != 'comments') {
            if (JSON.list[index].request.length > 240) {
              console.log('list')
              if (JSON.list[index].request == undefined) continue
              if (JSON.list[index].title == undefined) continue
              JSON.list[index].title = JSON.list[index].title + ' `Use d!ticket #' + JSON.list[index].requestid + ' to see full ticket`'
              JSON.list[index].request = JSON.list[index].request.slice(0, 240) + '...'
            } 
          }

          if (JSON.list[index].image_link != null || JSON.list[index].image_link != undefined) {
            if (JSON.list[index].image_link.length > 0) attachment = ' [Click to see attachment](' + JSON.list[index].image_link + ')'
          }

          if (args[1] != 'comments') metadata = '\n`Votes: ' + JSON.list[index].votes + '`\n`Ticket opened by ' + client.users.cache.get(JSON.list[index].userid).tag + ' on ' + new Date(JSON.list[index].date_epoch * 1).toLocaleString() + ' ID: ' + JSON.list[index].requestid + '`'
          embed.addField(JSON.list[index].title, JSON.list[index].request.replace(/\r?\n|\r/g, ' ') + attachment + metadata)
        }
        embed.setFooter('Page ' + (page || 1) + ' of ' + pages)

        callback(embed, pages)
      }

      if (args[0] === 'open') {
        // stop people making new tictets if one is ,alrady open
        let mark = true
        consandra.execute(`SELECT * FROM tickets`, (err, result) => { 
          for (const index in result.rows) {
            if (result.rows[index].userid === message.author.id && result.rows[index].title == undefined) { // check database to see if there is a ticket open with no title with there user id
              ticketEmbed(result.rows[index].requestid)
              mark = false
            }
          }
          if (mark) { // if mark is true makes a new ticket and stors it in the database
            const contentHashed = crypto.createHmac('sha1', 'build_a_problem').update(message.content + message.author.id + message.channel.id + Date.now()).digest('hex').slice(0,5).toLowerCase()

            consandra.execute('INSERT INTO tickets (userid, requestid, date_epoch, votes, voterid, completed, comments) VALUES (?, ?, ?, ?, ?, ?, ?)', [message.author.id, contentHashed, `${Date.now()}`, 1, `{"${message.author.id}": "up"}`, false, '[]'], { prepare: true }, err => {
              if (err) console.log(err)
            })
            ticketEmbed(contentHashed)
          }
        })
      }

      // list command
      if (args[0] === 'list') {
        let reactNumber = 1
        let JSON_data = {}
        // Stop members giveing wongre page numbers
        consandra.execute(`SELECT * FROM tickets`, (err, result) => {

          JSON_data.colour = 0xFEF65B
          JSON_data.title = 'List of open tickets'
          JSON.description = ''
          JSON_data.list = result.rows

          list_v2(message, JSON_data, args[1], false, 5, (embedContent, pages) => {
            message.channel.send(embedContent).then(msg => {
              if (pages != 1) {
                msg.react('◀️')
                msg.react('▶️')
              }
              
              const filter = (reaction, user) => { return ['▶️', '◀️'].includes(reaction.emoji.name) && user.id === message.author.id }
              const react = new Client.ReactionCollector(msg, filter, {time: 600000})
    
              .on('collect', collected => {
                collected.users.remove(message.author.id)
                if (collected.emoji.name === '▶️' && reactNumber != pages) reactNumber++, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber ,true, 5, (embedContent) => { msg.edit(embedContent) })
                if (collected.emoji.name === '◀️' && reactNumber !=1) reactNumber--, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber, true, 5, (embedContent) => { msg.edit(embedContent) })
                // i hate it but i have to make a copy of the json obj so the .shift() funcion does't destory the origaln data
              })
              .on('end', end => {
                msg.reactions.removeAll()
              })
            })
          })
        })
      }
      
      // help menu, that is all
      if (args[0] == undefined || args[0] === "help") {
        const embed = new Client.MessageEmbed()
          .setColor(0xFEF65B)
          .setTitle('Server tickets')
          .setDescription('Have an idea or feature you want added to doddlecord? Have a look below to open a ticket or vote for the ones you like!')
          .addField('Open a ticket', 'To open a ticket, use `d!ticket open` and you will be given a 5 digit code. This is the unique code where members can up or down vote your idea.')
          .addField('Fill in the ticket',  'Once you have your ticket ID set the title and description with:\n`d!ticket #[ticket ID] title [your title]` to set the title.\n`d!ticket #[ticket ID] description [your description]` to set the description.')
          .addField('To look at a ticket', 'Just use `d!ticket #[ticket ID]` to see the ticket.')
          .addField('Show open tickets list', 'Use `d!ticket list` to show a list of all the tickets open, orderd by the vote count.')
          .addField('To make, view, and delete comments', 'Use `d!ticket #[ticket ID] comment [your comment]` to add a comment.\nTo view use `d!tickets #[ticket ID] comments`\nTo delete use `d!ticket #[ticket ID] delete #[comment ID]`')
          .addField('How to vote', 'Find the ticket id and type `d!ticket #[ticket ID] up or down`')
          .setFooter('You can find ticket and comment IDs when viewing the lists. There is no edit for comments.')
        message.channel.send({ embed })
      }

      if (args[0].match(!'#') && args[0].length === 5) args[0] = '#' + args[0]

      if (args[0].match('#') && args[0].length === 6) {
        consandra.execute('SELECT * FROM tickets WHERE requestid = ? ALLOW FILTERING', [ticket_no], {prepare : true, fetchSize: 1}, (err, result) => {
          if (err) console.log(err)
          console.log()
          if (result.rows.length == 0) return message.channel.send('Could not find a ticket with that ID') // retund given id is not in the database 
  
          // standend embed of the ticket if no args have been given 
          if (args[1] == undefined) {
            const commentsJSON = JSON.parse(result.rows[0].comments)
            let comments = ''
            console.log(commentsJSON.length)
            if (commentsJSON.length == 0) comments = 'No comments'
            if (commentsJSON.length == 1) { 
              comments = '1 Comment, to view: ' + `\`d!ticket #${ticket_no} comments\`` 
            } else if (commentsJSON.length > 1 ) {
              comments = commentsJSON.length +' Comments, to view: ' + `\`d!ticket #${ticket_no} comments\``
            }
            
            const embed = new Client.MessageEmbed()
              .setColor(0xFEF65B)
              .setTitle(result.rows[0].title)
              .setDescription(result.rows[0].request + '\n\nVotes: ' + result.rows[0].votes + '\n' + comments)
              .setFooter('Ticket opened by ' + client.users.cache.get(result.rows[0].userid).tag + ' on ' + new Date(result.rows[0].date_epoch * 1).toLocaleString() + ' ID: ' + ticket_no)
              if (result.rows[0].image_link != null || result.rows[0].image_link != undefined) {
                if (result.rows[0].image_link.length > 0) embed.setImage(result.rows[0].image_link)
              }
            message.channel.send({ embed })
          }
          let mark = false // Mark is set true ticket when it is finiched, this boolean it set in the database under compleat
  
          // Votes are store in the DB formated as JSON as show: {"userid":"up" or "down", "userid":"up" or "down"...},
          // every member who votes gets added to the database, this under 'voterid' in the DB.
          // This keeps a log of who has voted and how they have voted. 
          // (members will not be able to see via doddlebot, who has voted on what ticket)
  
          if (args[1] === 'up' || args[1] === 'down') {
  
            const voterArray = JSON.parse(result.rows[0].voterid)
            if (voterArray[message.author.id] && voterArray[message.author.id] === args[1]) {
              return message.channel.send(`You have alredy ${args[1]}voted this ticket`)
            }
  
            if (result.rows[0].completed == false) {
              return message.channel.send('You can not ' + args[1] + 'vote an unfinished ticket')
            }
            voterArray[message.author.id] = args[1]
  
            function vote() {
              if (args[1] === 'up') return result.rows[0].votes + 1
              if (args[1] === 'down') return result.rows[0].votes - 1
            }
  
            consandra.execute(`UPDATE tickets SET votes = ${vote()}, voterid = ? WHERE requestid = ? AND userid = ?`, [JSON.stringify(voterArray), ticket_no, result.rows[0].userid], {prepare: true})
            const embed = new Client.MessageEmbed()
              .setColor(0xFEF65B)
              .setTitle('You have ' + args[1] + 'voted: ' + result.rows[0].title)
              .setFooter('Its now on ' + (vote()) + ' votes. Ticket opened by ' + client.users.cache.get(result.rows[0].userid).tag)
            message.channel.send({ embed })
          }
  
          // setting title and decription of tickets. This sets limits on charicter count (1700) and only alows the authro of said ticket to make channges
          if (args[1] === 'title' || args[1] === 'description') {
            if (result.rows[0].userid != message.author.id) return message.channel.send('You can not change the ' + args[1] + ' on someone else ticket')
            const title = message.content.slice(17 + args[1].length)
            var attachment = (message.attachments).array()
            var limit = 75
            var image_link = null
  
            if (args[1] === 'description') limit = 1700
            if (title.length > limit) return message.channel.send('Your ' + args[1] + ' is over the ' + limit + ' character limit by ' + (title.length - limit) + ' characters')
            if (args[1] === 'description') args[1] = 'request', mark = true
            console.log(attachment[0])
            if (attachment[0] != undefined && attachment[0].width != null) image_link = attachment[0].url
  
            consandra.execute(`UPDATE tickets SET ${args[1]} = ?, completed = ?, image_link = ? WHERE requestid = ? AND userid = ?`, [title, mark, image_link, ticket_no, message.author.id], {prepare: true})
            message.react('\u2705')
          }

          if (args[1] === 'comments') {
            let reactNumber = 1
            let JSON_data = {}
            // Stop members giveing wongre page numbers
            consandra.execute(`SELECT * FROM tickets WHERE requestid = ? AND completed = true ALLOW FILTERING`, [ticket_no], {prepare: true, fetchSize: 1}, (err, result) => {

              JSON_data.colour = 0xFEF65B
              JSON_data.title = "Comments for " + result.rows[0].title
              if (result.rows[0].comments == '[]') {
                JSON_data.description = '```' + result.rows[0].request + '```'
                JSON_data.list = [{ "title":"There are no comments on this ticket", "request":"Be the first with `d!ticket #" + ticket_no + " comment [your comment]`"}]
              } else {
                let parsedComments = JSON.parse(result.rows[0].comments)
                // + 'opened by ' + client.users.cache.get(result.rows[0].id).tag + ', Votes: ' +  +
                JSON_data.description = '```' + result.rows[0].request + `\n\nOpend by ${client.users.cache.get(result.rows[0].userid).tag}, Votes: ${result.rows[0].votes}` + '```' + '\n\u200B**Comments**'
                JSON_data.list = []
                for (var index = 0; index < parsedComments.length; index++) {
                  console.log(index)
                  
                  JSON_data.list.push(JSON.parse(`{ "title": "${client.users.cache.get(parsedComments[index].userid).tag} \`${new Date(parsedComments[index].date_epoch * 1).toLocaleString()} ID: ${parsedComments[index].id}\`", "request": "${parsedComments[index].content}", "attachment": "${parsedComments[index].attachment}"}`))
                }
              }

              console.log(JSON_data)
    
              list_v2(message, JSON_data, 1, false, 8, (embedContent, pages) => {
                
                message.channel.send(embedContent).then(msg => {
                  if (pages != 1) {
                    msg.react('◀️')
                    msg.react('▶️')
                  }
                  
                  const filter = (reaction, user) => { return ['▶️', '◀️'].includes(reaction.emoji.name) && user.id === message.author.id }
                  const react = new Client.ReactionCollector(msg, filter, {time: 600000})
        
                  .on('collect', collected => {
                    collected.users.remove(message.author.id)
                    if (collected.emoji.name === '▶️' && reactNumber != pages) reactNumber++, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber ,true, 8, (embedContent) => { msg.edit(embedContent) })
                    if (collected.emoji.name === '◀️' && reactNumber !=1) reactNumber--, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber, true, 8, (embedContent) => { msg.edit(embedContent) })
                    // i hate it but i have to make a copy of the json obj so the .shift() funcion does't destory the origaln data
                  })
                  .on('end', end => {
                    msg.reactions.removeAll()
                  })
                })
              })
            })
          }

          if (args[1] === 'comment') {
            const commentKeyGenID = crypto.createHmac('sha1', 'build_a_problem').update(message.content + message.author.id + message.channel.id + Date.now()).digest('hex').slice(0,5).toLowerCase()
            const content = message.cleanContent.slice(24)
            var commentPayload = JSON.parse(result.rows[0].comments)
            var attachment = (message.attachments).array()
            var image_link = null

            if (content === '') return message.channel.send("Comments can't be empty")
            if (content.length > 240) return message.channel.send("Comments can't be over 240 characters long, your at " + content.length)
            if (attachment[0] != undefined && attachment[0].width != null) image_link = attachment[0].url

            const commentJSON = `{"id":"${commentKeyGenID}","userid":"${message.author.id}","content":"${content}","date_epoch":"${Date.now()}","attachments":"${image_link}"}`

            commentPayload.push(JSON.parse(commentJSON))
            console.log(commentPayload)
            commentPayload = JSON.stringify(commentPayload)
            console.log(commentPayload)
            consandra.execute('UPDATE tickets SET comments = ? WHERE requestid = ? AND userid = ? IF EXISTS', [commentPayload, ticket_no, result.rows[0].userid], {prepare: true})
            message.react('\u2705')
          }
          const comments = JSON.parse(result.rows[0].comments)
          console.log(comments[args[2]] == undefined)


          // just for mods and admins or the owner of the ticket. if a ticket is down voted to hell or just shit, we/they can delete it 
          if (args[1] === 'delete') {
            if (args[2] != undefined) {
              const comments = JSON.parse(result.rows[0].comments)
              console.log(args[2].slice(1))
              var found = false
              for (const index in comments) {
                if (comments[index].id == [args[2].slice(1)]) {
                  found = true
                  if (comments[index].userid === message.author.id || message.member.roles.cache.has(bot.role.managersjoshesid) || message.member.roles.cache.has(bot.role.themods)) {
                    const embed = new Client.MessageEmbed()
                      .setColor('0xFF0000')
                      .setTitle('Are you sure you want to delete this comment')
                      .setDescription(comments[index].content)
                    message.channel.send({ embed }).then(msg => {
                      msg.react('\u2705')
                      const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }
        
                      msg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(reaction => {
                        if (reaction.first().emoji.name === '\u2705') {
                          react = true
                          msg.edit(embed.setTitle('Comment deleted').setDescription(''))
                          msg.reactions.removeAll()
                          
                          comments.splice(index, 1)
                          
                          consandra.execute('UPDATE tickets SET comments = ? WHERE requestid = ? AND userid = ? IF EXISTS', [JSON.stringify(comments), ticket_no, result.rows[0].userid], {prepare: true})
                        }
                      }).catch(err => {
                        msg.reactions.removeAll()
                        msg.edit(embed.setTitle('Delete timed out').setDescription(''))
                      });
                    })
                  } else message.channel.send('You can not delete others comments.')
                  break
                } 
              }
              if (found == false || comments.length == 0) message.channel.send('Comment ID cannot be found.')
              return
            }
          
            if (message.member.roles.cache.has(bot.role.managersjoshesid) || message.member.roles.cache.has(bot.role.themods) || message.author.id === result.rows[0].userid) {
              let react = false
              // give the member a look at the ticket befor deleting it
              const embed = new Client.MessageEmbed()
                .setColor('0xFF0000')
                .setTitle('Are you sure you want to delete this ticket')
                .setDescription('```' + result.rows[0].title + '\n\n' + result.rows[0].request + '\n\nTicket opened by ' + client.users.cache.get(result.rows[0].userid).tag + ' on ' + new Date(result.rows[0].date_epoch * 1).toLocaleString() + ' ID: ' + ticket_no + '```')
              message.channel.send({ embed }).then(msg => {
                msg.react('\u2705')
                const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }
  
                msg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(reaction => {
                  if (reaction.first().emoji.name === '\u2705') {
                    react = true
                    msg.edit(embed.setTitle('Ticket deleted').setDescription(''))
                    msg.reactions.removeAll()
                    consandra.execute('DELETE FROM tickets WHERE userid = ? AND requestid = ?', [result.rows[0].userid, ticket_no])
                  }
                }).catch(err => {
                  msg.reactions.removeAll()
                  msg.edit(embed.setTitle('Ticket delete timed out').setDescription(''))
                });
              })
            }
          }
        })
      }
    }

    // main ticket interaction  

    // ill be documenting all of doddlebot to a simier standerd to this (im hopeing this is some help to you two lol)

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
      // const user = message.author.id
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
        console.log(dbData)
    }
  })
})

// client.ws.on('INTERACTION_CREATE', async interaction => {
//   client.api.interactions(interaction.id, interaction.token).callback.post({data: {
//     type: 4,
//     data: {
//       content: 'hello world!'
//       }
//     }
//   })
// })
