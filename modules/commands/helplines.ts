const { MessageEmbed } = require('discord.js');
const bot = require('/home/pi/doddlebot/doddlebot_TS/json_files/data.json')

module.exports = {
  name: 'helplines',
  description: 'A list of helpful numbers in times of need.',
  execute(message, args) {
    if (args[0] === 'uk') {
    let embed = new MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('UK Helplines')
      .setDescription(bot.text.uk)
    message.channel.send({ embed })
    }
    if (args[0] === 'us') {
      let embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('USA Helplines')
        .setDescription(bot.text.us)
      message.channel.send({ embed })
    }
  }
}

export {}