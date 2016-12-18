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
		r.db(config.get("rethink").trackDB).table('trackers')
			.insert({key:shortKey, clicks:{}, hits:{}})
			.run((err, rr) => {
				callback(null, shortKey)
			})
	})
}

exports.getClickTrackers = function(req, res, key, callback) {
	r.db(config.get("rethink").trackDB).table('trackers').filter({key:key})
	.run((err, rest) => {
		hasTrackers = false
		if (rest[0]) {
			let trackerArray = Object.keys(rest[0].clicks).map(k => rest[0].clicks[k])
			if (trackerArray.length > 0)
				hasTrackers = true

			return callback(null, rest[0].clicks, hasTrackers)
		}
		callback(null, true)
	})
}

exports.getHitTrackers = function(req, res, key, callback) {
	r.db(config.get("rethink").trackDB).table('trackers').filter({key:key})
	.run((err, rest) => {
		hasTrackers = false
		let trackerArray = Object.keys(rest[0].hits).map(k => rest[0].hits[k])
		if (trackerArray.length > 0)
			hasTrackers = true
		callback(null, rest[0].hits, hasTrackers)
	})
}
