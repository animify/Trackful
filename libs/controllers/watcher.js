"use strict"

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')
const url = require('url')
const async = require('async')
const geoip = require('geoip-lite')
const countries = require('country-data').countries

exports.incrementClickTrack = (req, res, key, track, callback) => {
	const originUrl = url.parse(req.headers.origin)
	const originHost = originUrl.host
	r.db(config.get("rethink").trackDB).table('trackers').filter({key: key, domain:originHost, status: "active"}).update(
		{clicks: {[track] : r.row('clicks')(track).default(0).add(1)} },
		{returnChanges: true}
	).run(function(err, cursor) {
		if (cursor.changes) return callback(false, [track, cursor.changes[0].new_val.clicks[track]])

		callback(true, null)
	})
}

exports.incrementHitTrack = (req, res, key, href, callback) => {
	const preUrl = url.parse(href)
	const originUrl = url.parse(req.headers.origin)
	console.log(originUrl);
	const originHost = originUrl.host
	const page = preUrl.pathname + (preUrl.search != null ? preUrl.search : '') + (preUrl.hash != null ? preUrl.hash : '')
	const device = req.device.type + '/' + req.device.name
	const geo = geoip.lookup(req.ip)
	let country = null
	geo == null ? country = "Other" : country = countries[geo.country].name

	r.db('test_trackers').table('trackers').filter({key: key, domain: originHost, status: "active"}).update({
		hits: {[page] : r.row('hits')(page).default(0).add(1)},
		countries: {[country] : r.row('countries')(country).default(0).add(1)},
		devices: {[device] : r.row('devices')(device).default(0).add(1)}
	},
		{returnChanges: true}
	).run(function(err, cursor) {
		console.log(cursor);
		if (cursor.changes) {
			let cr = {}
			cr.page = [page, cursor.changes[0].new_val.hits[page]]
			cr.countries = [country, cursor.changes[0].new_val.countries[country]]
			cr.devices = [device, cursor.changes[0].new_val.devices[device]]
			return callback(null, cr)
		}
		callback(true, null)
	})

}

exports.deleteTracker = (req, res, key, callback) => {
	r.db('users').table('users').update((row) => {
		return {
			'keys': row('keys')
				.filter(function (item) { return item('id').ne(key) })
		}
	},{returnChanges: true}).run((err, cu) => {
		if (cu.replaced) {
			r.db('test_trackers').table('trackers').filter({key: key}).delete().run()
			r.db('data').table('sloth').filter({key: key}).delete().run()
			return callback(null, true)
		}
		callback(true, null)
	})
}
