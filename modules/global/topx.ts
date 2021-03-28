import { consandra } from './cassandra'
import { topxArray } from './interfaces'

export default function topx(x:number, mode:string, callback) {
  let queery:string = '' // geddit? It's because we're all gay.
  let title:string = ''
  if (mode == 'total') {
    queery = 'SELECT userid, nickname, level, points, totalpoints FROM member_data'
    title = `doddlecord's top ${x} of all time`
  } else if (mode == 'weekly') {
    queery = 'SELECT userid, nickname, wkylevel, wkypoints, wkytotalpoints FROM member_data'
    title = `doddlecord's top ${x} this week`
  }

  consandra.execute(queery, {prepare: true},(err, result) => {

    console.log(result)

    var topxArray:Array<topxArray> = []
    for (let i = 0; i < result.rowLength; i++) {
      if (result.rows[i].totalpoints == 0) continue
      if (mode == 'total') {
        topxArray.push({userid: result.rows[i].userid, nickname: result.rows[i].nickname, level:result.rows[i].level, points: result.rows[i].points, totalpoints:result.rows[i].totalpoints})
      }
      if (mode == 'weekly') {
        // topxArray.push({userid: result.rows[i].userid, nickname:result.rows[i].nickname, level:`${result.rows[i].wkylevel}`, points:`${result.rows[i].wkypoints}`, totalpoints:`${result.rows[i].wkytotalpoints}`})
      }
    }

    topxArray.sort((a: topxArray, b: topxArray) => b.totalpoints - a.totalpoints)


    // (function(){
    //   if (typeof Object.defineProperty === 'function'){
    //     try{Object.defineProperty(Array.prototype,'sortBy',{value:sortDBdata}) }catch(e){}
    //   }
    //   if (!Array.prototype.sortBy) Array.prototype.sortBy = sortDBdata

    //   function sortDBdata(f){
    //     for (var i=this.length;i;){
    //       var o = this[--i]
    //       this[i] = [].concat(f.call(o,o,i),o)
    //     }
    //     this.sort(function(a,b){
    //       for (var i=0,len=a.length;i<len;++i){
    //         if (a[i]!=b[i]) return a[i]<b[i]?-1:1
    //       } return 0
    //     })
    //     for (var i=this.length;i;){
    //       this[--i]=this[i][this[i].length-1]
    //     } return this
    //   }
    // })()

    // var topxSortBy = topxArray.sortBy(function(o){ return  -o.totalpoints })
    callback(topxArray)
  })
}