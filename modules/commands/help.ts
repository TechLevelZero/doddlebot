
const { MessageEmbed } = require('discord.js')

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['commands'],
	usage: '[command name]',
	cooldown: 5,
	execute(message, args) {
    const { commands } = message.client;

    if (!args.length) {
      const name = commands.map(command => command.name)
      const description = commands.map(command => command.description)

      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('Help, I need somebody')
        .setDescription('Looking for help? yes...well look below for the category you need help with!')

      for (let x = 0; x < name.length - 1; x++) {
        embed.addField('d!' + name[x], description[x])
      }

      message.channel.send({embed})
    }
	}
}

export{}