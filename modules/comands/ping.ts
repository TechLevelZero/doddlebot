import logger from "../global/logger";

module.exports = {
  name: 'ping', 
  description: 'Shows the ping in ms',

  execute(message) {
    const ping = Math.round(message.client.ws.ping)
    message.channel.send(`Ping is ${ping}ms`)
    logger('system' , message.author, `Ping was ${ping}ms`)  
  }
}