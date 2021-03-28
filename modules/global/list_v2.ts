const { MessageEmbed } = require('discord.js');

export default function list_v2(msg, JSON, page: number, react: boolean, listLength: number, args: Array<string>, callback) {

  const pages = (Math.ceil(JSON.list.length / listLength)) // Returns how many page is need to show all the tickets with a max of 5 tickets per page
  let embed = new MessageEmbed().setColor(JSON.colour || 0xFEF65B).setTitle(JSON.title)
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
      if (JSON.list[index].request == undefined || JSON.list[index].request == null ) continue
      if (JSON.list[index].title == undefined || JSON.list[index].title == null ) continue
      if (JSON.list[index].request.length > 240) {
        console.log('list')
        
        JSON.list[index].title = JSON.list[index].title + ' `Use d!ticket #' + JSON.list[index].requestid + ' to see full ticket`'
        JSON.list[index].request = JSON.list[index].request.slice(0, 240) + '...'
      } 
    }

    if (JSON.list[index].image_link != null || JSON.list[index].image_link != undefined) {
      if (JSON.list[index].image_link.length > 0) attachment = ' [Click to see attachment](' + JSON.list[index].image_link + ')'
    }

    if (args[1] != 'comments') {
      metadata = '\n`Votes: ' + JSON.list[index].votes + '`\n`Ticket opened by ' + msg.client.users.cache.get(JSON.list[index].userid).tag + ' on ' + new Date(JSON.list[index].date_epoch * 1).toLocaleString() + ' ID: ' + JSON.list[index].requestid + '`'
    }
    embed.addField(JSON.list[index].title, JSON.list[index].request.replace(/\r?\n|\r/g, ' ') + attachment + metadata)
  }
  embed.setFooter('Page ' + (page || 1) + ' of ' + pages)

  callback(embed, pages)
}