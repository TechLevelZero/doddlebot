
const config = require('../json_files/config.json');
const mysql = require('../node_modules/mysql');
const bot = require('../json_files/data.json');

// SQL config & connection handleing

const dbConfig = {
  host: '10.100.1.11',
  user: 'Admin',
  password: config.mysqlpass,
  database: 'doddlecord',
  charset: 'utf8mb4',
};

let con;

function handleDisconnect() {
  con = mysql.createConnection(dbConfig);
  con.connect((err) => {
    if (err) {
      setTimeout(handleDisconnect, 2000);
    }
  });
  con.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}
handleDisconnect();

process.argv[2]

function autoMember() {
  const cont = message.cleanContent.toLowerCase();

  con.query(`SELECT * FROM member_data WHERE userid = ${process.argv[2]}`, (err2, result) => {
    if (result.length > 0) {
      for (var word in bot.lookup) {
        if (cont.indexOf(word) != -1) {
          if (bot.lookup[word] < 0) {
            console.log(bot.lookup[word]*-1)
            con.query("UPDATE member_data SET score = score - " + (bot.lookup[word]*-1) + " WHERE userid = " + process.argv[2]);
          } else {
            console.log(bot.lookup[word]*-1 + ' in else')
            con.query("UPDATE member_data SET score = score + " + bot.lookup[word] + " WHERE userid = " + process.argv[2]);
          }
        }
      }
      if (result[0].score !== -3000000) {
        if (count > 14) {
          con.query(`UPDATE member_data SET score = score * 3 WHERE userid = ${process.argv[2]}`);
        }
        con.query(`UPDATE member_data SET score = score + ${count} WHERE userid = ${process.argv[2]}`);
        con.query(`UPDATE member_data SET score = score / 4 WHERE userid = ${process.argv[2]}`);
        con.query(`SELECT score FROM member_data WHERE userid = ${process.argv[2]}`, (err, result) => {
          if (result[0].score >= 1000) {
            // Automatically adding
            let addedRoles = [];
            for (let roleMeme in bot.newRoles) {
              if (cont.indexOf(roleMeme) !== -1) {
                role("add", message, bot.role[roleMeme.replace("/","")+"id"])
                addedRoles.push(roleMeme);
              }
            };
            if (addedRoles.length > 0) {
              message.channel.send(`I've added ${addedRoles.join(", ")} roles since it looks like you want them.`);
            }
            console.log('final score over 1000')
            const contentHashed = crypto.createHmac('sha256', config.key).update(cont).digest('hex');
            con.query('SELECT hash FROM member_data', (err, result19) => {
              const resultJson1 = JSON.stringify(result19);
              if (resultJson1.match(contentHashed)) {
                con.query(`UPDATE member_data SET score = - 3000000 WHERE userid = ${process.argv[2]}`);
                channel('secrets-for-the-mods').send(`${message.author.tag} copied a intro word for word, keep an eye on them!`);
              } else {
                con.query(`UPDATE member_data SET hash = '${contentHashed}' WHERE userid = ${process.argv[2]}`);
                // con.query(`UPDATE member_data SET wasmember = 1 WHERE userid = ${process.argv[2]}`);
                role('add', message, bot.role.memberid);
                logger('info' , message.author, `${message.author.tag} had been added by doddlebot'`);

                message.channel.send('Your intro was so good I was able to tell!, I have added you as a member. Welcome to doddlecord! Score: ' + result[0].score);
                console.log(`${message.author.tag} has been added by doddlebot`);
              }
            });
          }
        });
      }

    } else {
      const newIntro = [
        [`${process.argv[2]}`, 0],
      ];
      con.query('INSERT INTO member_data (`userid`, `score`) VALUES ?', [newIntro], (err3) => {
        if (err3) throw err3;
      });
      autoMember();
    }
  });
}
con.query(`SELECT score FROM member_data WHERE userid = ${process.argv[2]}`, (err, result) => {
  if (result.length > 0) {
    autoMember();
  }
});
autoMember();