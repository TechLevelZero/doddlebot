interface topxArray {
  userid: string
  nickname: string
  level: number
  points: number
  totalpoints: number
}

interface dbdata {
  userid: string
  nickname: string
  hash: string
  score: number
  level: number
  point: number
  totalpoints: number
  wkylevel: number
  wkypoints: number
  wkytotalpoints: number
  member: boolean
  roles: string
}

interface memberDataResuls {
  columns:Array<object>
  info: object
  nextPage: any | undefined
  nextPageAsync: any | undefined
  pageState: string | null
  rowLength: number
  rows: Array<dbdata>
  first: any
}

interface pointsJSON {
  points: number
  totalpoints : number
}

export { topxArray, memberDataResuls, dbdata, pointsJSON }