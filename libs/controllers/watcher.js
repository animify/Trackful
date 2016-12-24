const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')
const url = require('url')
const async = require('async')
const geoip = require('geoip-lite')
const countries = require('country-data').countries

exports.incrementClickTrack = function(req, res, key, track, callback) {
	r.db(config.get("rethink").trackDB).table('trackers').filter({key: key, domain:req.headers.host, status: "active"}).update(
		{clicks: {[track] : r.row('clicks')(track).default(0).add(1)} },
		{returnChanges: true}
	).run(function(err, cursor) {
		if (cursor.changes) {
			return callback(false, [track, cursor.changes[0].new_val.clicks[track]])
		}
		callback(true, null)
	})
}

exports.incrementHitTrack = function(req, res, key, href, callback) {
	const preUrl = url.parse(href)
	const page = preUrl.pathname + (preUrl.search != null ? preUrl.search : '') + (preUrl.hash != null ? preUrl.hash : '')
	const geo = geoip.lookup("5.189.140.246")
	const country = countries[geo.country].name
	console.log(country);

	async.parallel({
		page: (callback) => {
			r.db(config.get("rethink").trackDB).table('trackers').filter({key: key, domain: req.headers.host, status: "active"}).update(
				{hits: {[page] : r.row('hits')(page).default(0).add(1)} },
				{returnChanges: true}
			).run(function(err, cursor) {
				if (cursor.changes) {
					return callback(null, [page, cursor.changes[0].new_val.hits[page]])
				}
				callback(true, null)
			})
		},
		countries: (callback) => {
			r.db(config.get("rethink").trackDB).table('trackers').filter({key: key, domain: req.headers.host, status: "active"}).update(
			{countries: {[country] : r.row('countries')(country).default(0).add(1)} },
			{returnChanges: true}
			).run(function(err, cursor) {
				if (cursor.changes) {
					return callback(null, cursor.changes[0].new_val.countries)
				}
				callback(true, null)
			})
		}
	}, (err, arr) => {
		if (err) return callback(true, null)
		callback(null, arr)
	})
}

exports.deleteTracker = function(req, res, key, callback) {
	r.db('users').table('users').update((row) => {
		return {
			'keys': row('keys')
				.filter(function (item) { return item('id').ne(key) })
		}

	},{returnChanges: true}).run((err, cu) => {
		if (cu.replaced) {
			r.db(config.get("rethink").trackDB).table('trackers').filter({key: key}).delete().run()
			r.db('data').table('sloth').filter({key: key}).delete().run()
			return callback(null, true)
		}
		callback(true, null)
	})
}
