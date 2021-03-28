
const { MessageEmbed } = require('discord.js')
const bot = require('/home/pi/doddlebot/doddlebot_TS/json_files/data.json')

module.exports = {
  name: 'serious',
  description: 'access to an opt-in channel',
  execute(message) {
    if (message.member._roles.includes(bot.role.serid)) {
      message.channel.send('you already have access, if you want to remove it react with \u2705').then(msg => {
        msg.react('\u2705')
        const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }

        msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
          const reaction = collected.first()

          if (reaction.emoji.name === '\u2705') {
            message.reply('Your access has been removed')
            try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
            message.member.roles.remove(bot.role.serid)
          }
        }).catch(_collected => {
          try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
        })
      })
    } else {
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('Serious chat opt in WARNING')
        .setDescription(bot.text.serious)
      message.channel.send({ embed }).then(msg => {
        setTimeout(() => {
          msg.react('\u2705')
          const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }

          msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
            const reaction = collected.first()

            if (reaction.emoji.name === '\u2705') {
              message.reply('You now have access')
              try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
              message.member.roles.add(bot.role.serid)
            }
          }).catch(_collected => {
            try { msg.delete({ timeout: 1, reason: 'bot removed'}) } catch (err) { console.log('message already deleted')}
          })
        })
      })
    }
  }
}

export {}