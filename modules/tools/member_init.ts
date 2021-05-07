const { MessageEmbed } = require('discord.js');
const bot = require('../../json_files/data.json')

import channel from '../global/channel'

export default function message_init(member) {
    setTimeout(() => { // time out is need or new members can not see the message 
        const embed = new MessageEmbed()
            .setColor(0xFEF65B)
            .setTitle('**Welcome to doddlecord!** ' + member.user.username)
            .setDescription(bot.text.welcomemsg);
        channel(member, 'introduceyourself').send({embed}).then(msg => {
            setTimeout(() => {
                msg.delete({ timeout: 1, reason: 'bot removed'})
            }, 300000);
        })  
    }, 2500);
}

