/* eslint consistent-return: 0, no-console: 0 */

/*
doddlebot 1.1.7 by Ben Hunter
*/

const Discord = require('discord.js');

const config = require('./config.json');

const fs = require('fs');

const client = new Discord.Client();
// files
const colourcommandList = fs.readFileSync('command lists/colourcommands.txt', 'utf8');
const catcommandList = fs.readFileSync('command lists/catogerycommandlist.txt', 'utf8');
const perscommandList = fs.readFileSync('command lists/perscommandlist.txt', 'utf8');
const othercommandList = fs.readFileSync('command lists/othercommandlist.txt', 'utf8');
const welcomemsg = fs.readFileSync('txt_files/welcome message.txt', 'utf8');
const info = fs.readFileSync('logs/info.log', 'utf8');
const a = fs.readFileSync('Auto Member Requirements/a.txt');
const b = fs.readFileSync('Auto Member Requirements/b.txt');
const c = fs.readFileSync('Auto Member Requirements/c.txt');
const d = fs.readFileSync('Auto Member Requirements/d.txt');
const log4js = require('log4js');

// emojis
// const doddleoddleemot = client.emojis.get("406267153843486720");

log4js.configure({
  appenders: {
    multi: {
      type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log',
    },
  },
  categories: {
    default: { appenders: ['multi'], level: 'info' },
  },
});

const errorLogger = log4js.getLogger('fatal');
const infoLogger = log4js.getLogger('info');
const bugLogger = log4js.getLogger('debug');

client.login(config.token);

client.on('error', console.error);

client.on('error', (error) => {
  errorLogger.fatal(`${error}`);
});

client.on('ready', () => {
  client.user.setActivity('dodie on repeat', { type: 'LISTENING' });
  console.log(`Logged in as ${client.user.username}`);
  console.log(info);
  console.log('ARCHIVE LOADED');
});

client.on('guildMemberAdd', (member) => {
  console.log(`${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
  infoLogger.info(`ARCHIVE: ${member.user.tag} (${member.id}) has joined ${member.guild.name}`);
  member.guild.channels.find('name', 'introduce_yourself').send(`${member}`);
});

client.on('guildMemberAdd', (embedwelcome) => {
  const embed = new Discord.MessageEmbed()
    .setColor(0xFEF65B)
    .setTitle('**Welcome to doddlecord!**')
    .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
    .setDescription(welcomemsg);
  embedwelcome.guild.channels.find('name', 'introduce_yourself').send({ embed });
});

client.on('guildMemberRemove', (remember) => {
  console.log(`${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
  infoLogger.info(`ARCHIVE: ${remember.user.tag} (${remember.id}) Has left ${remember.guild.name}`);
  remember.guild.channels.find('name', 'general').send(`${remember} Has left ${remember.guild.name}, hopefully we see them again soon!`);
});

function memberid() {
  return '337015244050399242';
}
function limeid() {
  return '398201146461782016';
}
function roseid() {
  return '398201181987667971';
}
function blueskyid() {
  return '398301340691857408';
}
function lightvioletid() {
  return '398201219367305216';
}
function gayid() {
  return '399632904872787968';
}
function straightid() {
  return '399632983675502593';
}
function bisexualid() {
  return '399633024062455809';
}
function asexualid() {
  return '399688708921622530';
}
function pansexualid() {
  return '399689139131514891';
}
function femaleid() {
  return '399633209417138186';
}
function maleid() {
  return '399633179314749440';
}
function nonbinaryid() {
  return '399633884993683468';
}
function genderfluidid() {
  return '399706766914486282';
}
function agenderid() {
  return '407926177534312449';
}
function transid() {
  return '399633051111653376';
}
function hehimid() {
  return '399633081155452939';
}
function sheherid() {
  return '399633116739665940';
}
function theythemid() {
  return '399633143675486219';
}
function musicianid() {
  return '388482661158617098';
}
function artistid() {
  return '388482403942924309';
}
function memetrashid() {
  return '388482825793306626';
}
function managersjoshesid() {
  return '337016459429412865';
}
function modsid() {
  return '376873845333950477';
}

client.on('message', (message) => {
  if (message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (message.member.roles.has(memberid())) {
    // ESlint is a bitch
  } else if (message.content.toLowerCase().match(a)) {
    if (message.content.toLowerCase().match(b)) {
      if (message.content.toLowerCase().match(c)) {
        if (message.content.toLowerCase().match(d)) {
          message.member.addRole(memberid());
          message.channel.send('Your intro was so good I was able to tell!, I have added you as a member. Wellcome to doddlecord!');
          console.log(`${message.author.tag} has been added by doddlebot`);
          infoLogger.info(`ARCHIVE: ${message.author.tag} had been added by doddlebot`);
        } else return;
      } else return;
    } else return;
  } else return;

  if (message.content.indexOf(config.prefix) !== 0) return;

  // colour stuff

  if (command === 'lime') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(limeid())) {
        message.channel.send('You have lime...you lemon');
        console.log(`${message.author.tag} had the lime role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the lime role already`);
      } else {
        message.member.addRole(limeid());
        message.member.removeRole(roseid());
        message.member.removeRole(blueskyid());
        message.member.removeRole(lightvioletid());
        message.channel.send(`Lime is now your colour ${message.author}`);
        console.log(`${message.author.tag} now has the lime role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the lime role now`);
      }
    } else {
      message.channel.send(`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`);
      console.log(`${message.author.tag} was trying to add the lime role, but is not a member`);
      infoLogger.info(`ARCHIVE ${message.author.tag} was trying to add the lime role, but is not a member`);
    }
  }

  if (command === 'rose') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(roseid())) {
        message.channel.send('Rose are red, violets are blue, **you already have the rose red role**');
        console.log(`${message.author.tag} had the rose role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the rose role already`);
      } else {
        message.member.addRole(roseid());
        message.member.removeRole(limeid());
        message.member.removeRole(blueskyid());
        message.member.removeRole(lightvioletid());
        message.channel.send(`Rose is now your colour ${message.author}`);
        console.log(`${message.author.tag} now has the rose role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the rose role now`);
      }
    } else {
      message.channel.send(`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`);
      console.log(`${message.author.tag} was trying to add the rose role, but Is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add the rose role, but Is not a member`);
    }
  }

  if (command === 'bluesky') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(blueskyid())) {
        message.channel.send('Roses are red violets are blue **you already have role colour blue**'); // Thanks Scoop
        console.log(`${message.author.tag} had the blue sky role`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the blue sky role`);
      } else {
        message.member.addRole(blueskyid());
        message.member.removeRole(roseid());
        message.member.removeRole(limeid());
        message.member.removeRole(lightvioletid());
        message.channel.send(`Blue sky is now your colour ${message.author}`);
        console.log(`${message.author.tag} now has the blue sky role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the blue sky role now`);
      }
    } else {
      message.channel.send(`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`);
      console.log(`${message.author.tag} was trying to add the blue sky role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add the blue sky role, but is not a member`);
    }
  }

  if (command === 'lightviolet') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(lightvioletid())) {
        message.channel.send('You have light violet');
        console.log(`${message.author.tag} had the light violet role`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the light violet role`);
      } else {
        message.member.addRole(lightvioletid());
        message.member.removeRole(roseid());
        message.member.removeRole(blueskyid());
        message.member.removeRole(limeid());
        message.channel.send(`Light violet is now your colour ${message.author}`);
        console.log(`${message.author.tag} has the light violet now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the light violet now`);
      }
    } else {
      message.channel.send(`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`);
      console.log(`${message.author.tag} was trying to add the light violet role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add the light violet role, but is not a member`);
    }
  }

  if (command === 'removecolour') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(lightvioletid())) {
        message.member.removeRole(lightvioletid());
        message.channel.send(`light violet has been removed ${message.author}`);
        console.log(`${message.author.tag} Has removed light violet`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} Has removed light violet`);
      } else if (message.member.roles.has(blueskyid())) {
        message.member.removeRole(blueskyid());
        message.channel.send(`Blue Sky has been removed ${message.author}`);
        console.log(`${message.author.tag} Has removed sky blue`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} Has removed Blue sky`);
      } else if (message.member.roles.has(roseid())) {
        message.member.removeRole(roseid());
        message.channel.send(`rose has been removed ${message.author}`);
        console.log(`${message.author.tag} Has removed rose`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} Has removed Rose`);
      } else if (message.member.roles.has(limeid())) {
        message.member.removeRole(limeid());
        message.channel.send(`lime has been removed ${message.author}`);
        console.log(`${message.author.tag} Have removed lime`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} Has removed Lime`);
      } else {
        message.channel.send(`You dont have a colour asignd ${message.author}`);
      }
    } else {
      message.channel.send(`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`);
    }
  }

  // End of colour stuff

  // personality stuff

  if (command === 'gay') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(gayid())) {
        message.channel.send(`You already have the gay role ${message.author}`);
        console.log(`${message.author.tag} had the gay role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the gay role already`);
      } else {
        message.member.addRole(gayid());
        message.channel.send(`Gay role has been added ${message.author}`);
        console.log(`${message.author.tag} has the gay role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the gay role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'straight') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(straightid())) {
        message.channel.send(`You already have the straight role ${message.author}`);
        console.log(`${message.author.tag} had the straight role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
      } else {
        message.member.addRole(straightid());
        message.channel.send(`Straight has been added ${message.author}`);
        console.log(`${message.author.tag} has the straight role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the straight role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ACRHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'bi') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(bisexualid())) {
        message.channel.send(`you already have the bisexual role ${message.author}`);
        console.log(`${message.author.tag} had the bisexual role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the bisexual role already`);
      } else {
        message.member.addRole(bisexualid());
        message.channel.send(`Bisexual has been added ${message.author}`);
        console.log(`${message.author.tag} has the bisexual role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the bisexual role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'asex') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(asexualid())) {
        message.channel.send(`You already have the asexual role ${message.author}`);
        console.log(`${message.author.tag} had the asexual role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the asexual role already`);
      } else {
        message.member.addRole(asexualid());
        message.channel.send(`Asexual has been added ${message.author}`);
        console.log(`${message.author.tag} has the asexual role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the asexual role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'pan') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(pansexualid())) {
        message.channel.send(`You already have the pansexual role ${message.author}`);
        console.log(`${message.author.tag} had the pansexual role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the pansexual role already`);
      } else {
        message.member.addRole(pansexualid());
        message.channel.send(`Pansexual role has been added ${message.author}`);
        console.log(`${message.author.tag} has the pansexual role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the pansexual role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'female') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(femaleid())) {
        message.channel.send(`You already have the female role ${message.author}`);
        console.log(`${message.author.tag} had the female role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the female role already`);
      } else {
        message.member.addRole(femaleid());
        message.channel.send(`Female role has been added ${message.author}`);
        console.log(`${message.author.tag} has the female role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the female role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'male') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(maleid())) {
        message.channel.send(`You already have the male role ${message.author}`);
        console.log(`${message.author.tag} had the male role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the male role already`);
      } else {
        message.member.addRole(maleid());
        message.channel.send(`Male role has been added ${message.author}`);
        console.log(`${message.author.tag} has the male role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the male role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'nonbinary') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(nonbinaryid())) {
        message.channel.send(`You already have the non binary role ${message.author}`);
        console.log(`${message.author.tag} had the non binary role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the non binary role already`);
      } else {
        message.member.addRole(nonbinaryid());
        message.channel.send(`Non binary role has been added ${message.author}`);
        console.log(`${message.author.tag} has the non binary role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the non binary role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'fluid') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(genderfluidid())) {
        message.channel.send(`You already have the gender fluid role ${message.author}`);
        console.log(`${message.author.tag} had the gender fluid role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the gender fluid role already`);
      } else {
        message.member.addRole(genderfluidid());
        message.channel.send(`Gender fluid has been added ${message.author}`);
        console.log(`${message.author.tag} has the gender fluid role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the gender fluid role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'trans') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(transid())) {
        message.channel.send(`You already have the trans role ${message.author}`);
        console.log(`${message.author.tag} had the trans role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the trans role already`);
      } else {
        message.member.addRole(transid());
        message.channel.send(`Trans has been added ${message.author}`);
        console.log(`${message.author.tag} has the trans role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the trans role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'agender') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(agenderid())) {
        message.channel.send(`You already have the agender role ${message.author}`);
        console.log(`${message.author.tag} had the agender role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the agender role already`);
      } else {
        message.member.addRole(agenderid());
        message.channel.send(`agender has been added ${message.author}`);
        console.log(`${message.author.tag} has the agender role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the agender role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'hehim') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(hehimid())) {
        message.channel.send(`You already have the He/Him role ${message.author}`);
        console.log(`${message.author.tag} had the He/Him role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the He/Him role already`);
      } else {
        message.member.addRole(hehimid());
        message.channel.send(`He/Him has been added ${message.author}`);
        console.log(`${message.author.tag} has the He/Him role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the He/Him role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'sheher') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(sheherid())) {
        message.channel.send(`You already have the She/Her role ${message.author}`);
        console.log(`${message.author.tag} had the She/Her role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the She/Her role already`);
      } else {
        message.member.addRole(sheherid());
        message.channel.send(`She/Her role has been added ${message.author}`);
        console.log(`${message.author.tag} has the She/Her role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the She/Her role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'theythem') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(theythemid())) {
        message.channel.send(`You already have the They/Them role ${message.author}`);
        console.log(`${message.author.tag} had the They/Them role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
      } else {
        message.member.addRole(theythemid());
        message.channel.send(`They/Them has been added ${message.author}`);
        console.log(`${message.author.tag} has the They/Them role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the They/Them role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'musician') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(musicianid())) {
        message.channel.send(`You already have the musician role ${message.author}`);
        console.log(`${message.author.tag} had the ${message.content.slice(config.prefix.length)} role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the ${message.content.slice(config.prefix.length)} role already`);
      } else {
        message.member.addRole(musicianid());
        message.channel.send(`Musician has been added ${message.author}`);
        console.log(`${message.author.tag} has the musician role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the musician role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'artist') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(artistid())) {
        message.channel.send(`You already have the artist role ${message.author}`);
        console.log(`${message.author.tag} had the artist role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the artist role already`);
      } else {
        message.member.addRole(artistid());
        message.channel.send(`artist has been added ${message.author}`);
        console.log(`${message.author.tag} has the artist role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the artist role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  if (command === 'memetrash') {
    if (message.member.roles.has(memberid())) {
      if (message.member.roles.has(memetrashid())) {
        message.channel.send(`You already have the meme trash role ${message.author}`);
        console.log(`${message.author.tag} had the meme trash role already`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} had the meme trash role already`);
      } else {
        message.member.addRole(memetrashid());
        message.channel.send(`Meme Trash role has been added ${message.author}`);
        console.log(`${message.author.tag} has the meme trash role now`);
        infoLogger.info(`ARCHIVE: ${message.author.tag} has the meme trash role now`);
      }
    } else {
      message.channel.send((`${message.author} Looks like you are not a member, ask one of my managers or mods to add you. You may have not been added because you probably haven't introduce yourself`));
      console.log(`${message.author.tag} was trying to add a personality role, but is not a member`);
      infoLogger.info(`ARCHIVE: ${message.author.tag} was trying to add a personality role, but is not a member`);
    }
  }

  // end of personality stuff

  if (command === 'serverinfo') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setDescription(`**__${message.guild.name} Details__**`)
      .setThumbnail(message.guild.iconURL())
      .addField('Members', `${message.guild.memberCount - message.guild.members.filter(member => member.user.bot).size} Members`)
      .addField('Bots', `${message.guild.members.filter(member => member.user.bot).size} Bots`)
      .addField('Channels', `${message.guild.channels.filter(chan => chan.type === 'voice').size} voice / ${message.guild.channels.filter(chan => chan.type === 'text').size} text`)
      .addField('Mods', '@96drum @doctorzelda75 @SCಠಠP @emyflorence @philosophicalMoose')
      .addField('Managers', '@ShaunaSmells @TechLevelZero @Metakarp @Jaydork')
      .setFooter('d!patreon');
    message.channel.send({ embed });
  }

  if (command === 'colourroles') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Colour Role Help**')
      .setDescription('This is commands to add colour to your name in doddlecord! If you want a list of all commands look at #rules-n-stuff or use d!allhelp')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Colour Commands**', (colourcommandList));
    message.channel.send({ embed });
  }

  if (command === 'help') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Help**')
      .setDescription('Looking for help? yes...well look below for the category you need help with!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Commands**', (catcommandList))
      .setFooter('d!patreon');
    message.channel.send({ embed });
  }

  if (command === 'roles') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Help**')
      .setDescription('Looking for help? yes...well look below for the category you need help with!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Commands**', (catcommandList));
    message.channel.send({ embed });
  }

  if (command === 'personalroles') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Personal Role Help**')
      .setDescription('Personal roles are added to give a little info on who you are to other members of doddlecord. They are completely optional roles though')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Commands**', (perscommandList));
    message.channel.send({ embed });
  }

  if (command === 'allhelp') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**All Help**')
      .setDescription('Every command I can do!')
      .setThumbnail('https://pbs.twimg.com/media/DTDcEe-W4AUqV8D.jpg:large')
      .addField('**Category Commands**', (catcommandList))
      .addField('**Other Commands**', (othercommandList))
      .addField('**Colour Commands**', (colourcommandList))
      .addField('**Personal Commands**', (perscommandList))
      .setFooter('d!patreon');
    message.channel.send({ embed });
  }

  if (command === 'ping') {
    message.channel.send(`Ping is ${Math.round(client.ping)}ms`);
    infoLogger.info(`Ping was ${Math.round(client.ping)}ms`);
  }

  if (command === 'bug') {
    bugLogger.info(`ARCHIVE: ${message.author.tag} REPORTED ${message.content.slice(config.prefix.length).trim()}`);
    console.log(`${message.author.tag} REPORTING ${message.content.slice(config.prefix.length).trim()}`);
    message.channel.send(`Thanks ${message.author}, that has now been logged.`);
  }

  if (command === 'log') {
    if (message.member.roles.has(managersjoshesid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Info Log File', {
        files: ['./logs/info.log'],
      });
    } else if (message.member.roles.has(modsid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Info Log File', {
        files: ['./logs/info.log'],
      });
    } else return;
  }

  if (command === 'welcomeembedtest') {
    const embed = new Discord.MessageEmbed()
      .setColor(0xFEF65B)
      .setTitle('**Welcome to doddlecord!**')
      .setImage('https://cdn.discordapp.com/attachments/401431353482280960/401486447414345740/dodie_welcome1.png')
      .setDescription(welcomemsg);
    message.channel.send({ embed });
  }

  if (command === 'errors') {
    if (message.member.roles.has(managersjoshesid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Error Log File', {
        files: ['./logs/errors.log'],
      });
    } else if (message.member.roles.has(modsid())) {
      message.guild.channels.find('name', 'secrets-for-the-mods').send('Error Log File', {
        files: ['./logs/errors.log'],
      });
    } else return;
  }

  if (command === 'patreon') {
    message.channel.send('Support the bots @-----> <https://www.patreon.com/benhunter>');
  }
});
