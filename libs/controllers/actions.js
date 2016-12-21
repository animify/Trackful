const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')

const shortid = require('shortid')
const url = require('url')

exports.createKey = function(req, res, callback) {
	const shortKey = shortid.generate()
	const preUrl = url.parse(req.body.domain)

	if (preUrl.host && req.body.name) {
		r.table('users').get(req.user.id).update(
			{keys: r.row('keys').append({key: {id: shortKey, name: req.body.name, domain: preUrl.host, created: r.now().toEpochTime()}})}
		).run((err, cursor) => {
			r.db(config.get("rethink").trackDB).table('trackers')
				.insert({key:shortKey, clicks:{}, hits:{}, domain: preUrl.host, status: "active"})
				.run((err, rr) => {
					callback(null, shortKey)
				})
		})
	} else {
		callback({status: 404, message: "Invalid inputs"}, null)
	}

}

exports.getAllKeys = function(req, res, callback) {
	r.table('users').get(req.user.id)('keys')
	.run((err, userKeys) => {
		let keyArr = Object.keys(userKeys).map(k => userKeys[k].key)
		callback(null, keyArr)
	})
}

exports.getKeyInfo = function(req, res, key, callback) {
	r.table('users').get(req.user.id)('keys')('key').filter({id: key})
	.run((err, keyData) => {
		callback(null, keyData);
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
		if (rest[0]) {
			let trackerArray = Object.keys(rest[0].hits).map(k => rest[0].hits[k])
			if (trackerArray.length > 0)
				hasTrackers = true

			return callback(null, rest[0].hits, hasTrackers)
		}
		callback(null, true)
	})
}

exports.getClickData = function(req, res, key, callback) {
	r.db('data').table('sloth').get(key)
	.run((err, rest) => {
		if (rest != null) {
			let dataArray = Object.keys(rest.clicks).map(k => rest.clicks[k])
			if (dataArray.length > 22) {
				dataArray = dataArray.slice(dataArray.length - 21, dataArray.length - 1)
			}
			console.log(dataArray.length);
			return callback(null, dataArray)
		}
		callback(null, rest)
	})
}

exports.getHitData = function(req, res, key, callback) {
	r.db('data').table('sloth').get(key)
	.run((err, rest) => {
		if (rest != null) {
			let dataArray = Object.keys(rest.hits).map(k => rest.hits[k])
			console.log(parseInt(dataArray.length - 20));
			if (dataArray.length > 22) {
				dataArray = dataArray.slice(dataArray.length - 21, dataArray.length - 1)
			}
			return callback(null, dataArray)
		}
		callback(null, rest)
	})
}
