const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')
const shortid = require('shortid')

exports.createKey = function(req, res, callback) {
	console.log(req.user.id);
	r.table('users').get(req.user.id).update(
		{keys: r.row('keys').append({key: {id: shortid.generate(), name: req.body.name}})}
	).run(function(err, cursor) {
		console.log(cursor);
		callback(null, cursor)
	})
}
