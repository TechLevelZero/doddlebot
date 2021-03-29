const { MessageEmbed } = require('discord.js')
const bot = require('../../json_files/data.json')

module.exports = {
  name: 'roles',
  description: 'Let you add a viroty of roles ',
  execute(message, args) {

    // this needs reimpmenting as its shit

      const peradded1 = [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]]
      const embed = new MessageEmbed()
      const changed = []
      let state = 'NA'
      embed.setColor(0xFEF65B)

      const colours = ['lime', 'rose', 'blue', 'violet', 'aqua', 'yellow']

      function colourRemove() {
        for (const index in colours) {
          const colour = colours[index]
          if (message.member.roles.cache.has(bot.role[bot.newRoles[colour]])) {
            message.member.roles.remove(bot.role[bot.newRoles[colour]])
          }
        }
      }

      for (const index in colours) {
        if (peradded1.toString().match(colours[index])) {
          colourRemove()
        }
      }
      
      if (args[0] === 'remove') {
        embed.setTitle('Roles removed:')
        state = 'removed'
      } else {
        embed.setTitle('Roles added:')
        state = 'added'
        peradded1.unshift('added')
      }
      if (args[1] === 'all') {
        if (args[0] === 'remove') {
          const toRemove = ['gay', 'straight', 'bisexual', 'asexual', 'pansexual', 'female', 'male', 'lesbian', 'non binary', 'genderfluid', 'agender', 'hehim', 'sheher', 'theythem', 'trans', 'queer', 'homoromantic', 'heteroromantic', 'biromantic', 'aromantic', 'panromantic', 'karaokeid', 'study']
          for (let i = 0; i < toRemove.length; i++) {
            message.member.roles.remove(bot.role[toRemove[i].concat('id')])
          }
          message.reply('All personal roles have been removed')
        }
      } else {
        let mark = false
        for (const key in bot.newRoles) {
          // It's running for every one found
          if (peradded1.indexOf(key) != -1) {
            mark = true
            changed.push(`<@&${bot.role[bot.newRoles[key]]}>`)
            // Set role
            if (args[0] === 'remove') {
              message.member.roles.remove(bot.role[bot.newRoles[key]])
            } else {
              message.member.roles.add(bot.role[bot.newRoles[key]]).then(response => {
                console.log(response.roles.cache)
              })
              embed.setDescription(key)
            }
          }
        }

        if (!mark) {
          message.channel.send(`${message.author} example: d!roles gay male memedealer [For help type d!roleshelp]`)
        } else {
          embed.setDescription(changed.join('\n'))
          message.channel.send({ embed })
        }
      }
  }
}

export {}