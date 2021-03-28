
const {MessageEmbed} = require('discord.js')

module.exports = {
  name: 'serverinfo',
  description: 'Displays basic info about doddlecord.',
  execute(message) {
    const embed = new MessageEmbed()
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
}

export {}