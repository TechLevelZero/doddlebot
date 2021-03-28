const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'rules', 
  description: 'Shows the rules in a nice embed',

  execute(message) {
    const embed = new MessageEmbed()
    embed.setColor(0xFEF65B)
    embed.setTitle(`**Rules**`)
    embed.addField("Please do", 'Use the correct channels when sending messages, and think before @ing, or DMing a member')
    embed.addField("Don't be", 'racist, homophobic, transphobic, antisemitic or generally disrespectful')
    embed.addField("Don't post", 'NSFW (Not Safe For Work), NSFL (Not Safe For Life), and lewd content. Advertising other discord server is strictly NOT alowed (Please DM a manager josh about server Advertising)')
    embed.addField("Serious channel", '[This is an opt-in channel use d!serious for more info]\nWhen using the serious channel please be aware that some members may find certain topics triggering. Also remember that this chat is not a replacement for any kind of support you may have in place/need. Always talk to your GP or therapist if you are experiencing issues with your mental health. There is always someone to help you.')
    embed.addField('Allowed', 'Self promoteion is alowed in the related channels but do not spam, Swearing is alowed so long as it is not too much or directed at someone with the intention of causing offense/upset , ')
    message.channel.send({ embed })
  }
}

export{}