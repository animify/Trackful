"use strict"

const express = require('express')
const router = express.Router()

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const watcher = require(libs + '/controllers/watcher')
const actions = require(libs + '/controllers/actions')
const status = require(libs + '/controllers/status')
const auth = require(libs + 'auth/auth')

const request = require('request')
const fs = require('fs')
const async = require('async')
const cors = require('cors')

let io = global.socketIO

router.get('/', (req, res) => {
	res.render('index', {title: "Trackful"})
})

router.get('/getting-started', (req, res) => {
	res.render('getstarted', {title: "Getting Started - Trackful"})
})

router.get('/docs', (req, res) => {
	res.render('docs', {title: "Docs - Trackful"})
})

router.get('/pricing', (req, res) => {
	res.render('plans', {title: "Plans & Pricing - Trackful"})
})

router.get('/status', (req, res) => {
	async.parallel({
		trackers: (callback) => {
			status.trackers(req, res, (err, current) => {
				if (!err)
					callback(null, current)
			})
		},
		users: (callback) => {
			status.users(req, res, (err, current) => {
				if (!err)
					callback(null, current)
			})
		},
		data: (callback) => {
			status.data(req, res, (err, current) => {
				if (!err)
					callback(null, current)
			})
		},
		live: (callback) => {
			status.live(req, res, (err, current) => {
				if (!err)
					callback(null, current)
			})
		},
		sessions: (callback) => {
			status.sessions(req, res, (err, current) => {
				if (!err)
					callback(null, current)
			})
		}
	}, (err, arr) => {
		res.render('status', {title: "Status - Trackful", data: arr.data, trackers: arr.trackers, users: arr.users, live: arr.live, sessions: arr.sessions})
	})
})

router.get('/account', auth.presets, (req, res) => {
	res.render('account', {user: req.user, title: "Account - Trackful"})
})

router.get('/download', function(req, res){
	res.render('download')
})

router.get('/download/js', function(req, res){
	const trackfulJS = libs + '/public/js/trackful.min.js'
	res.download(trackfulJS)
})


router.get('/create/key', auth.presets, (req, res) => {
	res.render('createkey', {user: req.user, title: "Create Key - Trackful"})
})

router.post('/create/key', auth.presets, (req, res) => {
	actions.createKey(req, res, (err, shortKey) => {
		if (!err) {
			return res.send(shortKey)
		}
		res.json(err)
	})
})

router.get('/keys/all', auth.presets, (req, res) => {
	actions.getAllKeys(req, res, (err, keys) => {
		res.render('keys', {user: req.user, title: "All Keys - Trackful", keys: keys})
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
				const trackR = io.of(`/track_${req.params.key}`)
				res.render('key', {user: req.user, title: "Dashboard - Trackful", clicktrackers: arr.trackers[0], hittrackers: arr.trackers[1], countrytrackers: arr.trackers[2], devicetrackers: arr.trackers[3], hasTrackers: arr.trackers[4], trackKey: req.params.key, key: arr.key[0]})
			})

		} else {
			res.redirect('/keys/all')
		}
	})
})

router.get('/root', (req, res) => {
	res.render('test')
})

router.post('/endpoint/clicks', (req, res) => {
	watcher.incrementClickTrack(req, res, req.body.key, req.body.tracker, (err, result) => {
		if (!err) {
			const trackR = io.of(`/track_${req.body.key}`)
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
			const trackR = io.of(`/track_${req.body.key}`)
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
log

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

router.post('/endpoint/update/avatar', (req, res) => {
	actions.updateAvatar(req, res, req.body.avatar, (err, result) => {
		if (!err) {
			return res.send(result)
		}
		res.json(err)
	})
})

router.use(function(req, res, next){
	res.status(404)

	if (req.accepts('html')) return res.render('404', { url: req.url })

	if (req.accepts('json')) return res.send({ error: 404, message: 'Trackful: Page not found' })

	res.type('txt').send('Trackful 404: Page not found')
})

module.exports = router
