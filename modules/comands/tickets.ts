
const crypto = require('crypto')
const { MessageEmbed, ReactionCollector } = require('discord.js');
const bot = require('/home/pi/doddlebot/doddlebot_TS/json_files/data.json')

import { consandra } from '../global/cassandra'
import list_v2 from '../global/list_v2'


module.exports = {
  name: 'ticket',
  aliases: ['tickets', 't'],
  description: 'A ticketing system bulit in to doddlebot',

  execute(message, args) {

    function vote(args, result) {
      if (args[1] === 'up') return result.rows[0].votes + 1
      if (args[1] === 'down') return result.rows[0].votes - 1
    }

    let ticket_no = args[0].slice(1)
    // embed when opening a ticket
    function ticketEmbed(contentHashed) {
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('Your ticket ID is: ' + contentHashed)
        .setDescription('To fill in this ticket, see the commmands below\n\n`d!ticket #' + contentHashed + ' title [your title]` to set the title.\n`d!ticket #' + contentHashed +' description [your description]` to set the description.')
        .setFooter('Both a title and a description need to be given to be a valid ticket.\nYou dont need to use the square brackits [] in your title or description')
      message.channel.send({ embed })
    }

    if (args[0] === 'open') {
      // stop people making new tictets if one is ,alrady open
      let mark = true
      consandra.execute(`SELECT * FROM tickets`, (err, result) => { 
        for (const index in result.rows) {
          if (result.rows[index].userid === message.author.id && result.rows[index].title == undefined) { // check database to see if there is a ticket open with no title with there user id
            ticketEmbed(result.rows[index].requestid)
            mark = false
          }
        }
        if (mark) { // if mark is true makes a new ticket and stors it in the database
          const contentHashed = crypto.createHmac('sha1', 'build_a_problem').update(message.content + message.author.id + message.channel.id + Date.now()).digest('hex').slice(0,5).toLowerCase()

          consandra.execute('INSERT INTO tickets (userid, requestid, date_epoch, votes, voterid, completed, comments) VALUES (?, ?, ?, ?, ?, ?, ?)', [message.author.id, contentHashed, `${Date.now()}`, 1, `{"${message.author.id}": "up"}`, false, '[]'], { prepare: true }, err => {
            if (err) console.log(err)
          })
          ticketEmbed(contentHashed)
        }
      })
    }

    // list command
    if (args[0] === 'list') {
      let reactNumber = 1
      let JSON_data = {
        colour: 0,
        title: '',
        description: '',
        list: []
      }
      // Stop members giveing wongre page numbers
      consandra.execute(`SELECT * FROM tickets`, (err, result) => {
        JSON_data.colour = 0xFEF65B
        JSON_data.title = 'List of open tickets'
        JSON_data.list = result.rows

        JSON_data.list.sort((a, b) => b.votes - a.votes)

        list_v2(message, JSON_data, args[1], false, 5, args, (embedContent, pages) => {
          message.channel.send(embedContent).then(msg => {
            if (pages != 1) {
              msg.react('◀️')
              msg.react('▶️')
            }
            
            const filter = (reaction, user) => { return ['▶️', '◀️'].includes(reaction.emoji.name) && user.id === message.author.id }
            const react = new ReactionCollector(msg, filter, {time: 600000})
  
            .on('collect', collected => {
              collected.users.remove(message.author.id)
              if (collected.emoji.name === '▶️' && reactNumber != pages) reactNumber++, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber ,true, 5, args, (embedContent) => { msg.edit(embedContent) })
              if (collected.emoji.name === '◀️' && reactNumber !=1) reactNumber--, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber, true, 5, args, (embedContent) => { msg.edit(embedContent) })
              // i hate it but i have to make a copy of the json obj so the .shift() funcion does't destory the origaln data
            })
            .on('end', end => {
              msg.reactions.removeAll()
            })
          })
        })
      })
    }
    
    // help menu, that is all
    if (args[0] == undefined || args[0] === "help") {
      const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('Server tickets')
        .setDescription('Have an idea or feature you want added to doddlecord? Have a look below to open a ticket or vote for the ones you like!')
        .addField('Open a ticket', 'To open a ticket, use `d!ticket open` and you will be given a 5 digit code. This is the unique code where members can up or down vote your idea.')
        .addField('Fill in the ticket',  'Once you have your ticket ID set the title and description with:\n`d!ticket #[ticket ID] title [your title]` to set the title.\n`d!ticket #[ticket ID] description [your description]` to set the description.')
        .addField('To look at a ticket', 'Just use `d!ticket #[ticket ID]` to see the ticket.')
        .addField('Show open tickets list', 'Use `d!ticket list` to show a list of all the tickets open, orderd by the vote count.')
        .addField('To make, view, and delete comments', 'Use `d!ticket #[ticket ID] comment [your comment]` to add a comment.\nTo view use `d!tickets #[ticket ID] comments`\nTo delete use `d!ticket #[ticket ID] delete #[comment ID]`')
        .addField('How to vote', 'Find the ticket id and type `d!ticket #[ticket ID] up or down`')
        .setFooter('You can find ticket and comment IDs when viewing the lists. There is no edit for comments.')
      message.channel.send({ embed })
    }

    if (args[0].match(!'#') && args[0].length === 5) args[0] = '#' + args[0]

    if (args[0].match('#') && args[0].length === 6) {
      consandra.execute('SELECT * FROM tickets WHERE requestid = ? ALLOW FILTERING', [ticket_no], {prepare : true, fetchSize: 1}, (err, result) => {
        if (err) console.log(err)
        console.log()
        if (result.rows.length == 0) return message.channel.send('Could not find a ticket with that ID') // retund given id is not in the database 

        // standend embed of the ticket if no args have been given 
        if (args[1] == undefined) {
          const commentsJSON = JSON.parse(result.rows[0].comments)
          let comments = ''
          console.log(commentsJSON.length)
          if (commentsJSON.length == 0) comments = 'No comments'
          if (commentsJSON.length == 1) { 
            comments = '1 Comment, to view: ' + `\`d!ticket #${ticket_no} comments\`` 
          } else if (commentsJSON.length > 1 ) {
            comments = commentsJSON.length +' Comments, to view: ' + `\`d!ticket #${ticket_no} comments\``
          }
          
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle(result.rows[0].title)
            .setDescription(result.rows[0].request + '\n\nVotes: ' + result.rows[0].votes + '\n' + comments)
            .setFooter('Ticket opened by ' + message.client.users.cache.get(result.rows[0].userid).tag + ' on ' + new Date(result.rows[0].date_epoch * 1).toLocaleString() + ' ID: ' + ticket_no)
            if (result.rows[0].image_link != null || result.rows[0].image_link != undefined) {
              if (result.rows[0].image_link.length > 0) embed.setImage(result.rows[0].image_link)
            }
          message.channel.send({ embed })
        }
        let mark = false // Mark is set true ticket when it is finiched, this boolean it set in the database under compleat

        // Votes are store in the DB formated as JSON as show: {"userid":"up" or "down", "userid":"up" or "down"...},
        // every member who votes gets added to the database, this under 'voterid' in the DB.
        // This keeps a log of who has voted and how they have voted. 
        // (members will not be able to see via doddlebot, who has voted on what ticket)

        if (args[1] === 'up' || args[1] === 'down') {

          const voterArray = JSON.parse(result.rows[0].voterid)
          if (voterArray[message.author.id] && voterArray[message.author.id] === args[1]) {
            return message.channel.send(`You have alredy ${args[1]}voted this ticket`)
          }

          if (result.rows[0].completed == false) {
            return message.channel.send('You can not ' + args[1] + 'vote an unfinished ticket')
          }
          voterArray[message.author.id] = args[1]

          consandra.execute(`UPDATE tickets SET votes = ${vote(args, result)}, voterid = ? WHERE requestid = ? AND userid = ?`, [JSON.stringify(voterArray), ticket_no, result.rows[0].userid], {prepare: true})
          const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('You have ' + args[1] + 'voted: ' + result.rows[0].title)
            .setFooter('Its now on ' + (vote(args, result)) + ' votes. Ticket opened by ' + message.client.users.cache.get(result.rows[0].userid).tag)
          message.channel.send({ embed })
        }

        // setting title and decription of tickets. This sets limits on charicter count (1700) and only alows the authro of said ticket to make channges
        if (args[1] === 'title' || args[1] === 'description') {
          if (result.rows[0].userid != message.author.id) return message.channel.send('You can not change the ' + args[1] + ' on someone else ticket')
          const title = message.content.slice(17 + args[1].length)
          var attachment = (message.attachments).array()
          var limit = 75
          var image_link = null

          if (args[1] === 'description') limit = 1700
          if (title.length > limit) return message.channel.send('Your ' + args[1] + ' is over the ' + limit + ' character limit by ' + (title.length - limit) + ' characters')
          if (args[1] === 'description') args[1] = 'request', mark = true
          console.log(attachment[0])
          if (attachment[0] != undefined && attachment[0].width != null) image_link = attachment[0].url

          consandra.execute(`UPDATE tickets SET ${args[1]} = ?, completed = ?, image_link = ? WHERE requestid = ? AND userid = ?`, [title, mark, image_link, ticket_no, message.author.id], {prepare: true})
          message.react('\u2705')
        }

        if (args[1] === 'comments') {
          let reactNumber = 1
          let JSON_data = {
            colour: 0,
            title: '',
            description: '',
            list: []
          }
          // Stop members giveing wongre page numbers
          consandra.execute(`SELECT * FROM tickets WHERE requestid = ? AND completed = true ALLOW FILTERING`, [ticket_no], {prepare: true, fetchSize: 1}, (err, result) => {

            JSON_data.colour = 0xFEF65B
            JSON_data.title = "Comments for " + result.rows[0].title
            if (result.rows[0].comments == '[]') {
              JSON_data.description = '```' + result.rows[0].request + '```'
              JSON_data.list = [{ "title":"There are no comments on this ticket", "request":"Be the first with `d!ticket #" + ticket_no + " comment [your comment]`"}]
            } else {
              let parsedComments = JSON.parse(result.rows[0].comments)
              // + 'opened by ' + client.users.cache.get(result.rows[0].id).tag + ', Votes: ' +  +
              JSON_data.description = '```' + result.rows[0].request + `\n\nOpend by ${message.client.users.cache.get(result.rows[0].userid).tag}, Votes: ${result.rows[0].votes}` + '```' + '\n\u200B**Comments**'
              JSON_data.list = []
              for (var index = 0; index < parsedComments.length; index++) {
                console.log(index)
                
                JSON_data.list.push(JSON.parse(`{ "title": "${message.client.users.cache.get(parsedComments[index].userid).tag} \`${new Date(parsedComments[index].date_epoch * 1).toLocaleString()} ID: ${parsedComments[index].id}\`", "request": "${parsedComments[index].content}", "attachment": "${parsedComments[index].attachment}"}`))
              }
            }

            console.log(JSON_data)
  
            list_v2(message, JSON_data, 1, false, 8, args, (embedContent, pages) => {
              
              message.channel.send(embedContent).then(msg => {
                if (pages != 1) {
                  msg.react('◀️')
                  msg.react('▶️')
                }
                
                const filter = (reaction, user) => { return ['▶️', '◀️'].includes(reaction.emoji.name) && user.id === message.author.id }
                const react = new ReactionCollector(msg, filter, {time: 600000})
      
                .on('collect', collected => {
                  collected.users.remove(message.author.id)
                  if (collected.emoji.name === '▶️' && reactNumber != pages) reactNumber++, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber ,true, 8, args, (embedContent) => { msg.edit(embedContent) })
                  if (collected.emoji.name === '◀️' && reactNumber !=1) reactNumber--, list_v2(msg, JSON.parse(JSON.stringify(JSON_data)), reactNumber, true, 8, args, (embedContent) => { msg.edit(embedContent) })
                  // i hate it but i have to make a copy of the json obj so the .shift() funcion does't destory the origaln data
                })
                .on('end', end => {
                  msg.reactions.removeAll()
                })
              })
            })
          })
        }

        if (args[1] === 'comment') {
          const commentKeyGenID = crypto.createHmac('sha1', 'build_a_problem').update(message.content + message.author.id + message.channel.id + Date.now()).digest('hex').slice(0,5).toLowerCase()
          const content = message.cleanContent.slice(24)
          var commentPayload = JSON.parse(result.rows[0].comments)
          var attachment = (message.attachments).array()
          var image_link = null

          if (content === '') return message.channel.send("Comments can't be empty")
          if (content.length > 240) return message.channel.send("Comments can't be over 240 characters long, your at " + content.length)
          if (attachment[0] != undefined && attachment[0].width != null) image_link = attachment[0].url

          const commentJSON = `{"id":"${commentKeyGenID}","userid":"${message.author.id}","content":"${content}","date_epoch":"${Date.now()}","attachments":"${image_link}"}`

          commentPayload.push(JSON.parse(commentJSON))
          console.log(commentPayload)
          commentPayload = JSON.stringify(commentPayload)
          console.log(commentPayload)
          consandra.execute('UPDATE tickets SET comments = ? WHERE requestid = ? AND userid = ? IF EXISTS', [commentPayload, ticket_no, result.rows[0].userid], {prepare: true})
          message.react('\u2705')
        }
        const comments = JSON.parse(result.rows[0].comments)
        console.log(comments[args[2]] == undefined)


        // just for mods and admins or the owner of the ticket. if a ticket is down voted to hell or just shit, we/they can delete it 
        if (args[1] === 'delete') {
          if (args[2] != undefined) {
            const comments = JSON.parse(result.rows[0].comments)
            console.log(args[2].slice(1))
            var found = false
            for (const index in comments) {
              if (comments[index].id == [args[2].slice(1)]) {
                found = true
                if (comments[index].userid === message.author.id || message.member.roles.cache.has(bot.role.managersjoshesid) || message.member.roles.cache.has(bot.role.themods)) {
                  const embed = new MessageEmbed()
                    .setColor('0xFF0000')
                    .setTitle('Are you sure you want to delete this comment')
                    .setDescription(comments[index].content)
                  message.channel.send({ embed }).then(msg => {
                    msg.react('\u2705')
                    const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }
      
                    msg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(reaction => {
                      if (reaction.first().emoji.name === '\u2705') {
                        // onst react = true
                        msg.edit(embed.setTitle('Comment deleted').setDescription(''))
                        msg.reactions.removeAll()
                        
                        comments.splice(index, 1)
                        
                        consandra.execute('UPDATE tickets SET comments = ? WHERE requestid = ? AND userid = ? IF EXISTS', [JSON.stringify(comments), ticket_no, result.rows[0].userid], {prepare: true})
                      }
                    }).catch(err => {
                      msg.reactions.removeAll()
                      msg.edit(embed.setTitle('Delete timed out').setDescription(''))
                    });
                  })
                } else message.channel.send('You can not delete others comments.')
                break
              } 
            }
            if (found == false || comments.length == 0) message.channel.send('Comment ID cannot be found.')
            return
          }
        
          if (message.member.roles.cache.has(bot.role.managersjoshesid) || message.member.roles.cache.has(bot.role.themods) || message.author.id === result.rows[0].userid) {
            let react = false
            // give the member a look at the ticket befor deleting it
            const embed = new MessageEmbed()
              .setColor('0xFF0000')
              .setTitle('Are you sure you want to delete this ticket')
              .setDescription('```' + result.rows[0].title + '\n\n' + result.rows[0].request + '\n\nTicket opened by ' + message.client.users.cache.get(result.rows[0].userid).tag + ' on ' + new Date(result.rows[0].date_epoch * 1).toLocaleString() + ' ID: ' + ticket_no + '```')
            message.channel.send({ embed }).then(msg => {
              msg.react('\u2705')
              const filter = (reaction, user) => { return ['\u2705'].includes(reaction.emoji.name) && user.id === message.author.id }

              msg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(reaction => {
                if (reaction.first().emoji.name === '\u2705') {
                  react = true
                  msg.edit(embed.setTitle('Ticket deleted').setDescription(''))
                  msg.reactions.removeAll()
                  consandra.execute('DELETE FROM tickets WHERE userid = ? AND requestid = ?', [result.rows[0].userid, ticket_no])
                }
              }).catch(err => {
                msg.reactions.removeAll()
                msg.edit(embed.setTitle('Ticket delete timed out').setDescription(''))
              });
            })
          }
        }
      })
    }
  }
}