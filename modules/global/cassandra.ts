const cassandra = require('cassandra-driver')
const config = require('../../config/secret.json')

export const consandra = new cassandra.Client({
  contactPoints: [config.cassandraEndPoint],
  localDataCenter: 'datacenter1',
  keyspace: 'doddlecord'
})

