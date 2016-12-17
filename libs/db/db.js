const r = require('rethinkdbdash')({
	db: 'users'
})

r.db('test_clicks').table('trackers').changes().run(function(err, cursor) {
	cursor.each(console.log);
})

module.exports = r
