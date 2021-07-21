const { MessageEmbed, ReactionCollector } = require('discord.js');
const crypto = require('crypto')

import { consandra } from "../global/cassandra";
import list_v2 from "../global/list_v2";


module.exports = {
  name: 'karaoke',
  description: 'A queue for karoak members to keep track of performers',

  execute(message, args) {
    if (args[0] === 'help') {
      const embed = new MessageEmbed() 
        .setColor(0xFEF65B)
        .setTitle('Karaoke help menu')
        .addField('d!Karaoke help', 'Shows this menu')
        .addField('d!Karaoke add me', 'Added you to the queue')
        .addField('d!Karaoke remove me', 'Removes all your entrys in the queue')
        .addField('d!Karaoke queue', 'Shows the performer queue')
        .addField('d!Karaoke next up', 'says whos playing next')
        .addField('d!Karaoke skip', 'Skip a member if more then 20% o VC votes to skip or are above level 30 (comming soon)')
      message.channel.send({embed})
    }

    if (args[0] === 'add') {
      const contentHashed = crypto.createHmac('sha1', 'build_a_problem').update(message.content + message.author.id + message.channel.id + Date.now()).digest('hex').slice(0,5).toLowerCase()
      console.log(message.member)
      consandra.execute('INSERT INTO karaoke_queue (userid, requestid, date_epoch) VALUES (?, ?, ?)', [message.member.nickname, contentHashed, `${Date.now()}`], { prepare: true }, err => {
        if (err) console.log(err)
        const embed = new MessageEmbed() 
          .setColor(0xFEF65B)
          .setTitle('Added you to the queue')
        message.channel.send({embed})
      })
    }
    if (args[0] === 'remove') {
      const embed = new MessageEmbed() 
        .setColor(0xFEF65B)
        .setTitle('Removed you from the queue')
      message.channel.send({embed})
    }
    if (args[0] === 'queue') {

      consandra.execute(`SELECT * FROM karaoke_queue`, (err, result) => {

        result.rows.sort((a, b) => a.date_epoch - b.date_epoch)
        let description = ''

        for (let index = 0; index < result.rows.length; index++) {
          description += result.rows[index].userid + '\n'
        }
        
        const embed = new MessageEmbed() 
          .setColor(0xFEF65B)
          .setTitle('Performers queue')
          .setDescription(description)
        message.channel.send({embed})
      })
    }
    
    if (args[0] === 'next') {
      if (args[1] === 'up') {
        consandra.execute(`SELECT * FROM karaoke_queue`, (err, result) => {
          const embed = new MessageEmbed() 
            .setColor(0xFEF65B)
            .setTitle('Next up is ' + result.row.username)
          message.channel.send({embed})
        })
      }
    }
  }
}