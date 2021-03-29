const bot = require('../../json_files/data.json')

export default function channel(message, channel_name) {
  return message.client.channels.cache.get(bot.channels[channel_name])
}