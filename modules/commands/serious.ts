
const { MessageEmbed } = require('discord.js')
const { MessageButton } = require('discord-buttons');
const bot = require('../../json_files/data.json')

module.exports = {
  name: 'serious',
  description: 'access to an opt-in channel',
  execute(message) {
    if (message.member._roles.includes(bot.role.serid)) {
      const button = new MessageButton()
        .setStyle('red')
        .setLabel('Revoke Access') 
        .setID('revoke_access_to_serious')
      
      message.channel.send('you already have access, if you want to revoke your access click below', button).then(msg => {
        message.client.on('clickButton', async (button) => {
          if (button.id === 'revoke_access_to_serious' && message.author.id === button.clicker.user.id) {
            msg.edit('Your access has been removed', null)
            await button.reply.defer()
            message.member.roles.remove(bot.role.serid)
          }
        })
      });
    } else {
      const button = new MessageButton()
        .setStyle('green')
        .setLabel('Grant Access') 
        .setID('access_to_serious')
      
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('Serious chat opt in WARNING')
        .setDescription(bot.text.serious)
      
      message.channel.send({ embed, button }).then(msg => {

        message.client.on('clickButton', async (button) => {
          if (button.id === 'access_to_serious' && message.author.id === button.clicker.user.id) {
            msg.edit('You now have access', null)
            await button.reply.defer()
            message.member.roles.add(bot.role.serid)
          }
        })
      })
    }
  }
}

export {}