const { MessageEmbed, ReactionCollector } = require('discord.js');

import { consandra } from "../global/cassandra";
import list_v2 from "../global/list_v2";
import topx from "../global/topx";

module.exports = {
  name: 'top', 
  description: 'Shows the leaderboard of doddlecord',

  execute(message, args) {
    // let reactNumber = 1
    // let JSON_data = {
    //   colour: 0xFEF65B,
    //   title: 'Leaderboard',
    //   description: '',
    //   list: []
    // }
    // topx(2500, 'total', topx => {

    //   for(let x = 0; x < topx.length; x++) {
    //     JSON_data.list.push(JSON.parse(`{ "title":"#${x} ${topx[x].username}", "request":"At level ${topx[x].level} with ${topx[x].points} points.", "id" }`))
    //   }

    //   list_v2(message, JSON_data, args[1], false, 10, args, (embedContent, pages) => {

    //     message.channel.send(embedContent).then(msg => {
    //       if (pages != 1) {
    //         msg.react('◀️')
    //         msg.react('▶️')
    //       }
          
    //       const filter = (reaction, user) => { return ['▶️', '◀️'].includes(reaction.emoji.name) && user.id === message.author.id }
    //       const react = new ReactionCollector(msg, filter, {time: 600000})

    //       .on('collect', collected => {
    //         collected.users.remove(message.author.id)
    //         if (collected.emoji.name === '▶️' && reactNumber != pages) reactNumber++, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber ,true, 5, args, (embedContent) => { msg.edit(embedContent) })
    //         if (collected.emoji.name === '◀️' && reactNumber !=1) reactNumber--, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber, true, 5, args, (embedContent) => { msg.edit(embedContent) })
    //         // i hate it but i have to make a copy of the json obj so the .shift() funcion does't destory the origaln data
    //       })
    //       .on('end', end => {
    //         msg.reactions.removeAll()
    //       })
    //     })
    //   })
    // })

    const arg = parseInt(args[0])
    const embed = new MessageEmbed()
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
}