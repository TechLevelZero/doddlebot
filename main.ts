
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

// Discord login, looks to see if in DEV or STABLE branch
// Checks to see if in STABLE or INDEV and picks the corospoinding token
if (__dirname.match('STABLE')) {
  client.login(config.token)
} else {
  client.login(config.DEVtoken)
  client.on('debug', e => {return console.info(e)})
}

consandra.connect()

const commandFolders = fs.readdirSync('./modules').filter(dir => dir.name != 'global');
const commandFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.ts'))

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./modules/${folder}`).filter(file => file.endsWith('.ts'));
	for (const file of commandFiles) {
		const command = require(`./modules/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

client.on('message', message => {
  if (message.author.bot) return

  const memberPromise = new Promise((resolve, _reject) => {
    consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (err4, dbData:memberDataResuls) => {
      if (err4) {
        console.log(err4)
        logger('system', client.user, 'Error with member data CQL: ' + err4)
        channel(message, 'themods').send(`There was an error with ${message.author.tag}'s (${message.author.id}) data, doddlebot has recoved but the DB table may need checking\n\nERROR:\n${err4}`)
        message.channel.send('There was an issue with doddlebot.')
        return
      }
      if (dbData.first() === null) {
        consandra.execute('INSERT INTO member_data (userid,nickname,level,points,totalpoints,score,roles,wkylevel,wkypoints,wkytotalpoints) VALUES (?,?,?,?,?,?,?,?,?,?)', [`${message.author.id}`, `${message.member.displayName}`, 1, 0, 0, 0, `${message.member._roles}`, 1, 0, 0], { prepare: true }, err => {
          if (err) {
            console.log(err)
            logger('system', client.user, 'Error with adding member data')
            channel(message, 'themods').send(`There was an error with adding ${message.author.displayName}'s (${message.author.id}) data, doddlebot has recoved but the DB table may need checking for this member.\n\nERROR:\n${err}`)
            message.channel.send('There was an issue with doddlebot.')
            return
          } else {
            consandra.execute(`SELECT * FROM member_data WHERE userid = '${message.author.id}'`, (err, updated:memberDataResuls) => {
              if (err4) {
                console.log(err4)
                logger('system', client.user, 'Error with member data (second stage) CQL: ' + err)
                channel(message, 'themods').send(`There was an error with adding ${message.author.tag}'s (${message.author.id}) (second stage) data, doddlebot has recoved but the DB table may need checking for this member.\n\nERROR:\n${err4}`)
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

    if (!command) return

    try {
      command.execute(message, args, dbData)
    } catch (error) {
      console.error(error)
      message.reply('there was an error trying to execute that command!')
    }
  })
})
