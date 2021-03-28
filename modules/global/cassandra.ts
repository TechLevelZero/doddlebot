const cassandra = require('cassandra-driver')

export const consandra = new cassandra.Client({
  contactPoints: ['10.100.1.6'],
  localDataCenter: 'datacenter1',
  keyspace: 'doddlecord'
})

