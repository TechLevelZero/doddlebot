const { MessageEmbed } = require('discord.js');
const bot = require('../../json_files/data.json')

import channel from '../global/channel'

export default function message_init(message) {

    const embed = new MessageEmbed()
        .setColor(0xFEF65B)
        .setTitle('**Welcome to doddlecord!** ' + member.user.username)
        .setDescription(bot.text.welcomemsg);
    channel(message, 'introduceyourself').send({embed}).then(msg => {
        setTimeout(() => {
            msg.delete({ timeout: 1, reason: 'bot removed'})
        }, 300000);
    })
}

