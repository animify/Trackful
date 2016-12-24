const express = require('express')
const router = express.Router()

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const watcher = require(libs + '/controllers/watcher')
const actions = require(libs + '/controllers/actions')
const auth = require(libs + 'auth/auth')

const request = require('request')
const fs = require('fs')
const async = require('async')

let io = global.socketIO

router.get('/', (req, res) => {
	res.render('index')
})

router.get('/account', auth.presets, (req, res) => {
	res.render('account', {user: req.user})
})

router.get('/create/key', auth.presets, (req, res) => {
	res.render('createkey', {user: req.user})
})

router.post('/create/key', auth.presets, (req, res) => {
	actions.createKey(req, res, (err, shortKey) => {
		if (!err) {
			return res.send(shortKey)
		}
		res.status(500).json({ error: 'Something went wrong' })
	})
})

router.get('/keys/all', auth.presets, (req, res) => {
	actions.getAllKeys(req, res, (err, keys) => {
		res.render('keys', {user: req.user, keys: keys})
	})
})

router.get('/key/:key', auth.presets, (req, res) => {
	actions.validateKeyOwner(req, res, req.params.key, (err, owner) => {
		if (!err && owner) {
			async.parallel({
				trackers: (callback) => {
					actions.getTrackers(req, res, req.params.key, (err, clicksTrackers, hitsTrackers, countriesTrackers, devicesTrackers, hasClickTrackers) => {
						if (!err)
							callback(null, clicksTrackers, hitsTrackers, countriesTrackers, devicesTrackers, hasClickTrackers)
					})
				},
				key: (callback) => {
					actions.getKeyInfo(req, res, req.params.key, (err, info) => {
						if (!err) callback(null, info)
					})
				}
			}, (err, arr) => {
				console.log(arr.trackers);
				trackR = io.of(`/track_${req.params.key}`)
				res.render('key', {user: req.user, clicktrackers: arr.trackers[0], hittrackers: arr.trackers[1], countrytrackers: arr.trackers[2], devicetrackers: arr.trackers[3], hasTrackers: arr.trackers[4], trackKey: req.params.key, key: arr.key[0]})
			})

		} else {
			res.redirect('/account')
		}
	})
})

router.get('/root', (req, res) => {
	res.render('test')
})

router.post('/endpoint/clicks', (req, res) => {
	watcher.incrementClickTrack(req, res, req.body.key, req.body.tracker, (err, result) => {
		if (!err) {
			trackR = io.of(`/track_${req.body.key}`)
			trackR.emit('change',{
				change: result,
				type: 'click'
			})
			return res.send(result)
		}
		res.send(err)
	})
})

router.post('/endpoint/hits', (req, res) => {
	watcher.incrementHitTrack(req, res, req.body.key, req.body.page, (err, result) => {
		if (!err) {
			trackR = io.of(`/track_${req.body.key}`)
			trackR.emit('change',{
				change: result,
				type: 'hit'
			})
			return res.send(result)
		}
		res.send(err)
	})
})

router.get('/endpoint/data/clicks', (req, res) => {
	actions.getClickData(req, res, req.query.key, (err, result) => {
		if (!err) {
			return res.send(result)
		}
		res.status(500).json({ message: 'Error getting click data' })
	})
})

router.get('/endpoint/data/hits', (req, res) => {
	actions.getHitData(req, res, req.query.key, (err, result) => {
		if (!err) {
			return res.send(result)
		}
		res.status(500).json({ message: 'Error getting hit data' })
	})
})

router.post('/endpoint/key/delete', (req, res) => {
	watcher.deleteTracker(req, res, req.body.key, (err, result) => {
		if (!err) {
			return res.send(result)
		}
		res.status(500).json({ message: 'Something went wrong' })
	})
})

module.exports = router
