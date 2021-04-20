const crypto = require('crypto')
const bot = require('../../json_files/data.json')
const config = require('../../config/secret.json')

import logger from '../global/logger'
import channel from '../global/channel'
import { consandra } from '../global/cassandra'

export default function autoMember(message) {
  if (message.member.roles.cache.get(bot.role.memberid)) return
  const score = []
  const content = message.cleanContent.toLowerCase()

  for (var word in bot.lookup) {
    if (content.indexOf(word) != -1) {
      score.push(bot.lookup[word])
    }
  }

  var sum = score.reduce(function(a, b){
    return a + b
  })

  if (sum >= 1000) {
    const addedRoles = []
    for (const roleMeme in bot.newRoles) {
      if (content.indexOf(roleMeme) !== -1 && roleMeme !== 'artist') {
        message.member.roles.add(bot.role[roleMeme.replace('/','')+'id'])
        addedRoles.push(roleMeme)
      }
    }

    if (addedRoles.length > 0) {
      message.channel.send(`Added ${addedRoles.join(', ')} role(s) since it looks like you want them.`)
    }

    message.member.roles.add(bot.role.memberid)
    message.channel.send( `I've made you a member! If you haven't please read the ${channel(message, 'rules').name}. Also to pick your colour and personal roles go to ${channel(message, 'funwithbots').name}`)
    logger('info' , message.author, `${message.author.tag} had been added by doddlebot'`)
    const contentHashed = crypto.createHmac('sha512', config.key).update(content).digest('hex')
    consandra.execute(`UPDATE member_data SET hash = '${contentHashed}' WHERE userid = ${message.author.id}`)
  }
}