const { MessageEmbed } = require('discord.js');

import { consandra } from '../../modules/global/cassandra'
import topx from "../global/topx";

module.exports = {
  name: 'profile',
  description: 'gets info of the member formated in a nice embed,',
  execute(message, args, dbData) {
    var roleArray = []
      var wordCount = 0
      var popChannel = []
      var channelByPop = {}
      let mf = 1
      let m = 0
      let rank = 1
      let item

      function ordinal(i) {
        var j = i % 10, k = i % 100

        if (j == 1 && k != 11) { return i + 'st' }
        if (j == 2 && k != 12) { return i + 'nd' }
        if (j == 3 && k != 13) { return i + 'rd' }
        return i + 'th'
      }
      
      function arrayRole(roles) {
        console.log('start AR')
        for (var x = 0; x < roles.length; x++) {
          if ((x + 1) != (roles.length)) {
            roleArray.push('<@&' + roles[x] + '> ')
          } else {
            roleArray.push('<@&' + roles[x] + '>')
          }
        }
        console.log('finish AR')
      }

      function count(result) {
        console.log('start count')
        const channelIds = message.guild.channels.cache.filter(chan => {return chan.type === 'text'}).map(channel => {return channel.id})
        
        for (let i = 0; i < result.rowLength; i++) {
          channelByPop[result.rows[i].channel_id] = 0
        }

        for (let i = 0; i < result.rowLength; i++) { // checkes the length of the SQL result

          wordCount += result.rows[i].word_count // adding the points
          // popChannel.push(result.rows[i].channel_id)
          channelByPop[result.rows[i].channel_id] = (channelByPop[result.rows[i].channel_id] += 1)
        }
        console.log(result)
        for (var i = 0; i < result.rows.length; i++) {
          channelByPop[popChannel[i]] =+ 1
        }
        
        for (let i=0; i<popChannel.length; i++)
        {
          for (let j=i; j<popChannel.length; j++)
          {
            if (popChannel[i] == popChannel[j])
              m++
            if (mf<m)
            {
              mf=m
              item = popChannel[i]
            }
          }
          m=0
        }
      }

      if (args[0] != null) {

        if (message.mentions.users.first() === undefined) return message.channel.send('That is not a member, usages: `d!profile [@member]`')
        var mentionedUser = message.mentions.users.first()
        topx(message.guild.memberCount, 'total', (topx) => {
          rank += topx.map(function(result) { return result.userid}).indexOf(mentionedUser.id)
        })
        consandra.execute(`SELECT * FROM member_data WHERE userid = '${mentionedUser.id}'`, (err, result) => {
          if (err) console.log(err)
          consandra.execute('SELECT * FROM message_metadata_v2 WHERE user_id = ?', [mentionedUser.id], {prepare : true, fetchSize: 250000}, (_err, archive) => {
            const row = result.first()
            console.log(archive)
            if (row == null) return message.channel.send('Can not find a profile on this member.')

            var mentioned = (message.client.guilds.cache.get('337013993669656586').members.cache.get(mentionedUser.id))
            const embed = new MessageEmbed()
              .setColor(mentioned.displayHexColor)
              .setTitle(`${mentioned.displayName}'s Profile`, true)
              .setThumbnail(mentionedUser.displayAvatarURL())
              .setDescription('Loading...')
            message.channel.send({ embed }).then(msg => {
              count(archive)
              arrayRole(mentioned._roles)

              const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.mentions.users.first().id).joinedAt}`.trim().split(/ +/g)
              const embed = new MessageEmbed()
                .setColor(mentioned.displayHexColor)
                .setTitle(`${mentioned.displayName}'s Profile`, true)
                .setThumbnail(mentionedUser.displayAvatarURL())
                .addField('Rank',  `Position: ${ordinal(rank)}` + '\nLevel: ' + (row['level']) + '\nPoints: ' + (row['points']) + '\nNext Level In ' + ((row['level'] * 100) - row['points']) + ' Points' + `\nTotal points gained: ${row['totalpoints']}`, true)
                .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}`, true) //\nMost used channel: ${item}\nwith ${mf} messages
                .addField('\u200B', '\u200B')
                .addField('Roles', roleArray.join(''))
                .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`)
              message.channel.send({ embed })
              msg.delete({ timeout: 1, reason: 'bot removed'})
            })
          })
        })
      } else {
        topx(message.guild.memberCount, 'total', (topx) => {
          rank += topx.map(function(result) { return result.userid}).indexOf(message.author.id)
        })
        const embed = new MessageEmbed()
          .setColor(message.member.displayHexColor)
          .setTitle(`Your Profile ${message.member.displayName}`, true)
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription('Loading...')
        message.channel.send({ embed }).then(msg => {
          consandra.execute('SELECT * FROM message_metadata_v2 WHERE user_id = ?', [message.author.id], {prepare : true, fetchSize: 250000}, (err, archive) => {
            if (err) console.log(err)
            count(archive)
            arrayRole(message.member._roles)
            const joinDateArray = `${message.client.guilds.cache.get('337013993669656586').members.cache.get(message.author.id).joinedAt}`.trim().split(/ +/g)
            const embed = new MessageEmbed()
              .setColor(message.member.displayHexColor)
              .setTitle(`Your Profile ${message.member.displayName}`, true)
              .setThumbnail(message.author.displayAvatarURL())
              .addField('Rank', `Position: ${ordinal(rank)}` + '\nLevel: ' + (dbData['level']) + '\nPoints: ' + (dbData['points']) + '\nNext Level In ' + ((dbData['level'] * 100) - dbData['points']) + ' Points' + `\nTotal points gained: ${dbData['totalpoints']}`, true)
              .addField('Member Stats', `Messages: ${archive.rows.length}\nWord Count: ${wordCount}`, true) // \nMost used channel: ${item}\nwith ${mf} messages`, true)
              .addField('\u200B', '\u200B')
              .addField('Roles', roleArray.join(''))
              .setFooter(`Joined on ${joinDateArray[0]} ${joinDateArray[1]} ${joinDateArray[2]} ${joinDateArray[3]} at ${joinDateArray[4]}`)
            message.channel.send({ embed })
            msg.delete({ timeout: 1, reason: 'bot removed'})
          })
        })
      }
  }
}

export {}