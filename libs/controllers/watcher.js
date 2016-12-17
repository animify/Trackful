const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')

exports.incrementClickTrack = function(req, res, key, track, callback) {
	r.db('test_clicks').table('trackers').filter({key: key}).update(
		r.object(`track-${track}`, r.row(`track-${track}`).default(0).add(1))
	).run(function(err, cursor) {
		console.log(cursor);
		callback(null, cursor)
	})
}
