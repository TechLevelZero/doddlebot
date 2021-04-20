
const fs = require('fs')
const Discord = require('discord.js')
const config = require('./config/secret.json')

import { consandra } from './modules/global/cassandra'
import logger from './modules/global/logger'
import channel from './modules/global/channel'
import autoMember from './modules/tools/autoMember'
import message_init from './modules/tools/message_init'
import { dbdata, memberDataResuls } from './modules/global/interfaces'

const client = new Discord.Client()
client.commands = new Discord.Collection()

// Checks to see if in STABLE or INDEV dir and picks the corospoinding token
if (__dirname.match('TS')) { // bodge but fuck it lol
  client.login(config.token)
} else {
  client.login(config.DEVtoken)
  client.on('debug', e => {return console.info(e)})
}

// Discord error handleing
client.on('error', e => {return console.error(e)})
client.on('warn', e => {return console.warn(e)})

consandra.connect()

const commandFolders = fs.readdirSync('./modules').filter(dir => dir.name != 'global');

for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./modules/${folder}`).filter(file => file.endsWith('.ts'));
  for (const file of commandFiles) {
    const command = require(`./modules/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

client.on('guildMemberAdd', member => { 
  if (member.user.tag.match('discord.gg')) {
    member.kick(member.id)
    return
  }
  logger('info' , member, `${member.user.tag} has joined ${member.guild.name}`)
})

// need to set up removele of there member ID from metadata archive
client.on('guildMemberRemove', remember => {
  consandra.execute(`DELETE FROM member_data WHERE userid = '${remember.id}'`)
  logger('info' , remember, `${remember.user.tag} Has left ${remember.guild.name}`)
  channel(remember, 'themods').send(`${remember.user.tag.slice(0, -5)} has left the server`)
})

client.on('message', message => {
  if (message.author.bot) return

  const memberPromise = new Promise((resolve, _reject) => {
    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (err_dbData, dbData:memberDataResuls) => {
      if (err_dbData) {
        console.log(err_dbData)
        logger('system', client.user, 'Error with member data CQL: ' + err_dbData)
        channel(message, 'themods').send(`There was an error with ${message.author.tag}'s (${message.author.id}) data, doddlebot has recoved but the DB table may need checking\n\nERROR:\n${err_dbData}`)
        message.channel.send('There was an issue with doddlebot.')
        return
      }
      if (dbData.first() === null) {
        consandra.execute('INSERT INTO member_data (userid,nickname,level,points,totalpoints,score,roles,wkylevel,wkypoints,wkytotalpoints) VALUES (?,?,?,?,?,?,?,?,?,?)', [`${message.author.id}`, `${message.member.displayName}`, 1, 0, 0, 0, `${message.member._roles}`, 1, 0, 0], { prepare: true }, err_INSERT => {
          if (err_INSERT) {
            console.log(err_INSERT)
            logger('system', client.user, 'Error with adding member data')
            channel(message, 'themods').send(`There was an error with adding ${message.author.displayName}'s (${message.author.id}) data, doddlebot has recoved but the DB table may need checking for this member.\n\nERROR:\n${err_INSERT}`)
            message.channel.send('There was an issue with doddlebot.')
            return
          } else {
            consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (err_updated_dbData, updated:memberDataResuls) => {
              if (err_updated_dbData) {
                console.log(err_updated_dbData)
                logger('system', client.user, 'Error with member data (second stage) CQL: ' + err_updated_dbData)
                channel(message, 'themods').send(`There was an error with adding ${message.author.tag}'s (${message.author.id}) (second stage) data, doddlebot has recoved but the DB table may need checking for this member.\n\nERROR:\n${err_updated_dbData}`)
                message.channel.send('There was an issue with doddlebot.')
                return
              }
              console.log('New Member Data Added To The Table')
              resolve(updated)
            })
          }
        })
      } else {
        resolve(dbData)
      }
    })
  })

  memberPromise.then((data:memberDataResuls) => {
    const dbData:dbdata = data.first()

    const args:Array<string> = message.content.toLowerCase().slice(config.prefix.length).trim().split(/ +/g)
    const commandName:string = args.shift().toLowerCase()
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))

    // Tools
    autoMember(message) //adds members based on there intro, compares their intro to a index table; word in the index are worth points and if their intro, is or exsedes 1000 points the member role is added.
    message_init(message, dbData)

    if (message.content === 'd!kill') {
      if (message.member.roles.cache.has('337016459429412865') || (message.author.id === '394424134337167360')) {
        logger('system' , message.author, `${message.author.tag} Had shutdown doddlebot')`)
        process.exit()
      }
    }

    if (message.content.indexOf(config.prefix) !== 0) return
    if (!command) return

    try {
      command.execute(message, args, dbData)
    } catch (error) {
      console.error(error)
      message.reply('There was an error trying to execute that command!')
    }
  })
})
 