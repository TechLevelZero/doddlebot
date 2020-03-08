/* eslint-disable no-loop-func */
const config = require('../json_files/config.json');
const cassandra = require('../node_modules/cassandra-driver');
const fs = require('fs');
const PDFDocument = require('../node_modules/pdfkit');
const bot = require('../json_files/data.json');

// SQL config & connection handleing

const consandra = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'doddlecord'
});

consandra.connect();

let dbData = []
let resultCQL

// data collection
var dataPromise = new Promise(function(resolve, reject) {
  consandra.execute(`SELECT * FROM member_data  WHERE userid = '${process.argv[2]}'`, (err, results) => { resultCQL = results })

  consandra.execute('SELECT * FROM message_metadata WHERE userid = ?', [process.argv[2]], {prepare : true, fetchSize: 25000}, (err, result) => {
    for (let i = 0; i < result.rowLength; i++) {
      dbData.push({id:`${result.rows[i].id}`, channel:`${result.rows[i].channel}`, pointscount:`${result.rows[i].pointscount}`, wordcount:`${result.rows[i].wordcount}`, date:`${result.rows[i].date}`})
    }
    // data ordering
    (function(){
      if (typeof Object.defineProperty === 'function'){
        try{Object.defineProperty(Array.prototype,'sortBy',{value:sortDBdata}); }catch(e){}
      }
      if (!Array.prototype.sortBy) Array.prototype.sortBy = sortDBdata;
      
      function sortDBdata(f){
        for (var i=this.length;i;){
          var o = this[--i];
          this[i] = [].concat(f.call(o,o,i),o);
        }
        this.sort(function(a,b){
          for (var i=0,len=a.length;i<len;++i){
            if (a[i]!=b[i]) return a[i]<b[i]?-1:1;
          } return 0;
        });
        for (var i=this.length;i;){
          this[--i]=this[i][this[i].length-1];
        } return this;
      }
    })();

    dbData = dbData.sortBy(function(o){ return new Date( o.date ) })
    setTimeout(() => { resolve(true) }, 100)
  })
})

dataPromise.then(function(value) {

  const doc = new PDFDocument({
    size: 'A4',
    // margin: 25
  })

  

  // data beautification 

  // PDFKit




  function archiveData(callback) {
  //////////////////////
  /// YearArrayBlock ///
  //////////////////////
  // console.log(result.rows[0].points)
    const getYear = new Date().getFullYear() //Get the currant year
    const getMonth = new Date().getMonth()
    var yearData = []   //
    var points = []     //
    var wordCount = []  // this is passed tought as a callback
    var channel = []    //
    var channelCom = [] //
    var noDataCount = 0 //
    var resultSQL
    for (let y = 2018; y < getYear +1; y++) { // checks the year (started colleding data in 2018)
    // if (process.argv[3] != undefined) y == process.argv[3]
      var yearlyData = []  // this is the data that had been put into yearly order
      var pointsData = 0   //
      var wordData = 0     //
      var channelData = [] //
      for (let i = 0; i < dbData.length; i++) { // checkes the length of the SQL result
        const argsDate = `${dbData[i].date}`.trim().split(/ +/g); // Grabs the date of each result
        // console.log(argsDate[3])
        if (argsDate[3] === `${y}`) { // if the year of the message is with in the year of the first for loop then is added to the yearlyData arry
          yearlyData.push(dbData[i]) // pushed to array
          pointsData += parseInt(dbData[i].pointscount) // adding the points
          wordData += parseInt(dbData[i].wordcount) // adding the points
          channelData.push(dbData[i].channel) // pushing channel data
        // console.log(argsDate[3])
        }
      }
      yearData.push(yearlyData) // each year is then pushed into the data arrays, this also makes this function atoumectly expandble. nothing to do when the new year comes!
      points.push(pointsData)   //
      wordCount.push(wordData)  //
      channel.push(channelData) //

      setTimeout(() => {
        let channelCounts = {}
        channel[y - 2018].forEach(function(x) { channelCounts[x] = (channelCounts[x] || 0)+1; }); // counting the channel freqency
        setTimeout(() => { channelCom.push(channelCounts) }, 500)
        if (yearData[y - 2018].length === 0) {
          noDataCount++ // if no data is present for early years they are counted up
        }
      }, 2000)
    }
    setTimeout(() => {
      callback(yearData, points, wordCount, channelCom, noDataCount, resultCQL)
    }, 12000)
  }

  // start PDPkit
  doc.pipe(fs.createWriteStream(`../tmp/${process.argv[3]} [${process.argv[2]}].pdf`));
  doc.image('../imgs/databackground.PNG', 0, 0, {fit: [900, 1000]})
  doc.image('../imgs/hiresdoddlecord.PNG', {
    fit: [475, 200],
    align: 'center',
  });
  // .fillColor('white')
  const height = doc.currentLineHeight();
  doc.font('../fonts/Roboto-Thin.ttf').fontSize(11);
  doc.text(`\nYour data ${process.argv[3]}`, { align: 'center' });
  doc.text(process.argv[4].replace(/_/g, ' ') || '\nYou last joined on: No data', { align: 'center' });
  doc.text(bot.text.gdpr);
  archiveData((yearData, points, wordCount, channel, noDataCount, result) => {
    let mark = false
    for (let i = 0; i < yearData.length; i++) {
      i += noDataCount // if there was no data in earler years we add the amount of years with no data to i
      mark = false
      const argsDate = `${yearData[i][i].date}`.trim().split(/ +/g);
      var year = argsDate[3]
      doc.addPage() // second page
      doc.fontSize(80)
      doc.text(year, { align: 'center' })
      doc.fontSize(20)
      doc.text('Stats\n', { align: 'center' });
      doc.fontSize(11)
      if (year > 2018) { // points
        doc.text('Points gained in the year: ' + points[i] || 'No data', { align: 'center' })
      } else {
        doc.text('Points may have no data, this is normal for 2018', { align: 'center' })
      }
      doc.text(`Messages sent: ` + yearData[i].length, { align: 'center' }) // total message sent
      doc.text('Word Count: ' + wordCount[i], { align: 'center' }) // wordcount
      doc.text('\nChannel usage (In no order)', { align: 'left' }) // top channles
      for (let z = 0; z < Object.keys(channel[i]).length; z++) {
        var key = Object.keys(channel[i])
        doc.text(`      ${key[z]} with ${channel[i][key[z]]} messages`, { align: 'left' })
      }
      // biggist message
      for (let messageData = 0; messageData < yearData[i].length; messageData++) {
        const argsDateM = `${yearData[i][messageData].date}`.trim().split(/ +/g);
        function month() {
          doc.addPage().fontSize(40).text(bot.months[argsDateM[1]]);
          doc.fontSize(11);
        }
        function day() {
          doc.fontSize(20).moveDown().text(`${argsDateM[0]}, ${argsDateM[2]}`);
          doc.fontSize(10);
        }
        if (mark === false) {
          mark = true
          month()
          day()
        }
        if (messageData > 0) {
          const argsDateBefor = `${yearData[i][messageData -1].date}`.trim().split(/ +/g);
          if (argsDateM[1] != argsDateBefor[1]) {
            month()
          }
          if (argsDateM[0] != argsDateBefor[0]) {
            day()
          }
        }
        //  Message #${yearData[i][messageData].id || 'No data'} 
        const text = `    ${argsDateM[4] || 'No data'} In channel: ${yearData[i][messageData].channel || 'No data'}  Word count: ${yearData[i][messageData].messagecount || 'No data(Img)'}  Points: ${yearData[i][messageData].pointsgained || "No data"}`
        function isEven(n) {
          return n % 2 == 0;
        }
        if (isEven(messageData)) {
          doc.highlight(80, doc.y, doc.widthOfString('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'), height, {color: 'lightgray'}).text(text)
        } else {
          doc.text(text);
        }
      // doc.moveDown()
      //   .fillColor('black')
      //   .highlight(doc.x, doc.y, doc.widthOfString('This text is highlighted!'), height, {color: 'gray'})
      //   .text('This text is highlighted!');
      // doc.text(text);
      }
      doc.addPage().fontSize(32);
      doc.text('Raw Member Data\n', { align: 'center' });
      doc.fontSize(11);
      doc.text(`\ndoddlebot ID: ${result.rows[0].id} Discord ID: ${result.rows[0].userid}\n Nickname: ${result.rows[0].nickname}\nIntro Score: ${result.rows[0].score}\nIntro Fingerprint:\n${result.rows[0].hash}\n\nTime Zone: ${result.rows[0].timeOrLoc}\nLevel: ${result.rows[0].level} Points: ${result.rows[0].points} Total Points: ${result.rows[0].totalpoints}\nData Epoch: ${result.rows[0].dataepoch}\nRoles\n${result.rows[0].roles}`, { align: 'center' });
    }
  })
  setTimeout(() => { 
    doc.end()
    setTimeout(() => {
      process.exit();
    }, 2000)
  }, 20000)
})