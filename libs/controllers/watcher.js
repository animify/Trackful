const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')
const url = require('url')

exports.incrementClickTrack = function(req, res, key, track, callback) {
	r.db(config.get("rethink").trackDB).table('trackers').filter({key: key}).update(
		{clicks: {[track] : r.row('clicks')(track).default(0).add(1)} },
		{returnChanges: true}
	).run(function(err, cursor) {
		callback(null, cursor.changes[0].new_val.clicks)
	})
}

exports.incrementHitTrack = function(req, res, key, href, callback) {
	const preUrl = url.parse(href)
	const page = preUrl.pathname + (preUrl.search != null ? preUrl.search : '') + (preUrl.hash != null ? preUrl.hash : '')
	r.db(config.get("rethink").trackDB).table('trackers').filter({key: key}).update(
		{hits: {[page] : r.row('hits')(page).default(0).add(1)} },
		{returnChanges: true}
	).run(function(err, cursor) {
		callback(null, cursor.changes[0].new_val.hits)
	})
}
