import { consandra } from './cassandra'

export default function logger(type, member, data) {
	consandra.execute('INSERT INTO logger (id,type,userid,message,date) VALUES (uuid(), ?, ?, ?, ?)', [ type, member.id, data, Date.now()], { prepare: true }, err => {
		if (err) console.log(err)
		console.log(data)
	})
}