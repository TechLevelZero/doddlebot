const bot = require('/home/pi/doddlebot/doddlebot_TS/json_files/data.json')

import { pointsJSON } from '../global/interfaces'
import { consandra } from '../global/cassandra'


export default function message_init(message, dbData) {
  let ganinedpoints = 0
  if (message.content.length > 8 && !message.cleanContent.match('pls ')) {
    const pointsRandom = (Math.floor(Math.random() * 18) + 5)
    const WpointsRandom = (Math.floor(Math.random() * 22) + 9)
    const pointsJSON:pointsJSON = { 'points':pointsRandom + dbData['points'], 'totalpoints':pointsRandom + dbData['totalpoints'] }
    const wkyPointsJSON:pointsJSON = { 'points':WpointsRandom + dbData['wkypoints'], 'totalpoints':WpointsRandom + dbData['wkytotalpoints'] }
    ganinedpoints = pointsRandom

    if (dbData['level'] * 100 <= pointsJSON.points) {
      const rounedTotal = Math.round(pointsJSON.totalpoints/100) * 100
      const queries = [
        { query: `UPDATE  member_data SET level = ${dbData['level'] + 1} WHERE userid = '${dbData['userid']}'` },
        { query: `UPDATE  member_data SET points = 0 WHERE userid = '${dbData['userid']}'` },
        { query: `UPDATE  member_data SET totalpoints = ${rounedTotal} WHERE userid = '${dbData['userid']}'` }
      ]
      consandra.batch(queries, { }).then(function() { console.log('Member Leveled Up') }).catch(function(err) { console.log(err) })
      message.reply(`You are now level ${dbData['level'] + 1}, ${message.author}`)
    } else {
      const queries = [
        { query: `UPDATE  member_data SET points = ${pointsJSON.points} WHERE userid = '${dbData['userid']}'` },
        { query: `UPDATE  member_data SET totalpoints = ${pointsJSON.totalpoints} WHERE userid = '${dbData['userid']}'` }
      ]
      consandra.batch(queries, { }).then().catch(function(err) { console.log(err) })
    }
    if (message.member.roles.cache.has(bot.role.managersjoshesid) == message.member.roles.cache.has(bot.role.modsid)) {
      if (dbData['wkylevel'] * 100 <= wkyPointsJSON.points) {
        const rounedTotal = Math.round(wkyPointsJSON.totalpoints/100) * 100
        const queries = [
          { query: `UPDATE  member_data SET wkylevel = ${dbData['wkylevel'] + 1} WHERE userid = '${dbData['userid']}'` },
          { query: `UPDATE  member_data SET wkypoints = 0 WHERE userid = '${dbData['userid']}'` },
          { query: `UPDATE  member_data SET wkytotalpoints = ${rounedTotal} WHERE userid = '${dbData['userid']}'` }
        ]
        consandra.batch(queries, { }).then(function() { console.log('[weekly] Member Leveled Up') }).catch(function(err) { console.log(err) })
      } else {
        const queries = [
          { query: `UPDATE  member_data SET wkypoints = ${wkyPointsJSON.points} WHERE userid = '${dbData['userid']}'` },
          { query: `UPDATE  member_data SET wkytotalpoints = ${wkyPointsJSON.totalpoints} WHERE userid = '${dbData['userid']}'` }
        ]
        consandra.batch(queries, { }).then().catch(function(err) { console.log(err) })
      }
    }
  }
  var pattern = /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g
  var m = message.content.match(pattern)
  var count = 0

  if (!m) return

  for (var i = 0; i < m.length; i++) {
    if (m[i].charCodeAt(0) >= 0x4e00) {
      count += m[i].length
    } else {
      count += 1
    }
  }

  if (dbData['nickname'] != message.member.displayName) {
    consandra.execute('UPDATE member_data SET nickname=? WHERE userid=?', [message.member.displayName, message.author.id], { prepare: true }, err3 => {
      if (err3) throw err3
      console.log('User nickname updated')
    })
  }
  
  consandra.execute('INSERT INTO message_metadata_v2 (id,user_id,channel_id,date,word_count,points_count) VALUES (uuid(),?,?,?,?,?)', [message.author.id, message.channel.id, Date.now(), count, ganinedpoints], { prepare: true }, err => {
    if (err) console.log('unable to add message metadata to table\n\nERROR:\n' + err)
    console.log('Message Metadata Archived')
  })
}