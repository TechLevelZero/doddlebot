const fs = require('fs')
const { MessageEmbed } = require('discord.js');

const bot = require('../../json_files/data.json')

module.exports = {
  name: 'roleshelp',
  description: 'Help and list menu for all our roles',
  execute(message) {
    const embed = new MessageEmbed()
    .setColor(0xFEF65B)
    .setTitle('Role Help')
    .setDescription('Roles are added to give a little info on who you are to other members of doddlecord.\nThey are completely optional roles though. Make sure you spell them correctly or it will not add them!')
    .addField('Use', '```d!roles [remove] Gay Hehim Artist```')
    .addField('Identity  Roles', (bot.identityRoles), true)
    .addField('Sexuality Roles', (bot.sexualityRoles), true)
    .addField('Romantic Roles', (bot.romanticRoles), true)
    .addField('Pronoun Roles', (bot.pronounRoles), true)
    .addField('Catch all Roles', (bot.question), true)
    .addField('Colour Roles', (bot.colourRoles), true)
    .addField('Mentionable Roles', (bot.mentionableRoles), true)
    .addField('Extra Roles', (bot.extraRoles), true)
    .addField('\u200B', '\u200B', true)
    .setFooter('*Roles are mentionable by everyone!')
  message.channel.send({ embed })
  }
}

export {}