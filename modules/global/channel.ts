const bot = require('/home/pi/doddlebot/doddlebot_TS/json_files/data.json')

export default function channel(message, channel_name) {
  return message.client.channels.cache.get(bot.channels[channel_name])
}