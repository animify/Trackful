const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')
const shortid = require('shortid')

exports.createKey = function(req, res, callback) {
	const shortKey = shortid.generate()

	r.table('users').get(req.user.id).update(
		{keys: r.row('keys').append({key: {id: shortKey, name: req.body.name}})}
	).run((err, cursor) => {
		r.db(config.get("rethink").clicksDB).table('trackers')
			.insert({key:shortKey, trackers:[]})
			.run((err, rr) => {
				callback(null, shortKey)
			})
	})
}

exports.getTrackers = function(req, res, key, callback) {
	r.db(config.get("rethink").clicksDB).table('trackers').filter({key:key})
	.run((err, rest) => {
		hasKeys = false
		let trackerArray = Object.keys(rest[0].trackers).map(k => rest[0].trackers[k])
		console.log(trackerArray);
		if (trackerArray.length > 0)
			hasKeys = true
		callback(null, rest[0].trackers, hasKeys)
	})
}
