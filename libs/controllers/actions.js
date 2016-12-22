const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const r = require(libs + 'db/db')

const shortid = require('shortid')
const url = require('url')

exports.validateKeyOwner = (req, res, key, callback) => {
	if (key) {
		r.db('users').table('users').filter({id: req.user.id}).filter((row) => {
			return row("keys").contains((k) => {
				return k("id").eq(key)
			})
		}).run((err, cursor) => {
			(cursor[0] != undefined) ? callback(null, true) : callback(true, null)
		})
	} else {
		callback({status: 404, message: "Invalid input"}, null)
	}
}

exports.createKey = (req, res, callback) => {
	const shortKey = shortid.generate()
	const preUrl = url.parse(req.body.domain)
	const d = new Date()
	const epoch = Math.round(d.getTime() / 1000)

	if (preUrl.host && req.body.name) {
		r.table('users').get(req.user.id).update(
			{keys: r.row('keys').append({id: shortKey, name: req.body.name, domain: preUrl.host, created: r.now().toEpochTime()})}
		).run((err, cursor) => {
			r.db('data').table('sloth').insert({id: shortKey, type:'data', hits: [{[epoch]: 0}], clicks: [{[epoch]: 0}]}).run()
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

exports.getAllKeys = (req, res, callback) => {
	r.table('users').get(req.user.id)('keys')
	.run((err, userKeys) => {
		let keyArr = Object.keys(userKeys).map(k => userKeys[k])
		callback(null, keyArr)
	})
}

exports.getKeyInfo = (req, res, key, callback) => {
	r.table('users').get(req.user.id)('keys').filter({id: key})
	.run((err, keyData) => {
		callback(null, keyData);
	})
}

exports.getClickTrackers = (req, res, key, callback) => {
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

exports.getHitTrackers = (req, res, key, callback) => {
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

exports.getClickData = (req, res, key, callback) => {
	r.db('data').table('sloth').get(key)
	.run((err, rest) => {
		if (rest != null) {
			let dataArray = Object.keys(rest.clicks).map(k => rest.clicks[k])
			if (dataArray.length > 22) {
				dataArray = dataArray.slice(dataArray.length - 21, dataArray.length - 1)
			}
			return callback(null, dataArray)
		}
		callback(null, rest)
	})
}

exports.getHitData = (req, res, key, callback) => {
	r.db('data').table('sloth').get(key)
	.run((err, rest) => {
		if (rest != null) {
			let dataArray = Object.keys(rest.hits).map(k => rest.hits[k])
			if (dataArray.length > 22) {
				dataArray = dataArray.slice(dataArray.length - 21, dataArray.length - 1)
			}
			return callback(null, dataArray)
		}
		callback(null, rest)
	})
}
