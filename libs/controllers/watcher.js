const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')
const url = require('url')

exports.incrementClickTrack = function(req, res, key, track, callback) {
	r.db(config.get("rethink").trackDB).table('trackers').filter({key: key, domain:req.headers.host}).update(
		{clicks: {[track] : r.row('clicks')(track).default(0).add(1)} },
		{returnChanges: true}
	).run(function(err, cursor) {
		if (cursor.changes) {
			return callback(null, [track, cursor.changes[0].new_val.clicks[track]])
		}
		callback(null, true)
	})
}

exports.incrementHitTrack = function(req, res, key, href, callback) {
	const preUrl = url.parse(href)
	const page = preUrl.pathname + (preUrl.search != null ? preUrl.search : '') + (preUrl.hash != null ? preUrl.hash : '')
	r.db(config.get("rethink").trackDB).table('trackers').filter({key: key, domain: req.headers.host}).update(
		{hits: {[page] : r.row('hits')(page).default(0).add(1)} },
		{returnChanges: true}
	).run(function(err, cursor) {
		if (cursor.changes) {
			return callback(null, [page, cursor.changes[0].new_val.hits[page]])
		}
		callback(null, true)
	})
}
