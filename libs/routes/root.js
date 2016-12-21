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

const io = global.socketIO

router.get('/', function(req, res) {
	res.render('index')
})

router.get('/account', auth.presets, function(req, res) {
	res.render('account', {user: req.user})
})

router.get('/create/key', auth.presets, function(req, res) {
	res.render('createkey', {user: req.user})
})

router.post('/create/key', auth.presets, function(req, res) {
	actions.createKey(req, res, (err, shortKey) => {
		if (!err) {
			res.send(shortKey)
		} else {
			req.json(err)
		}
	})
})

router.get('/keys/all', auth.presets, function(req, res) {
	actions.getAllKeys(req, res, (err, keys) => {
		console.log(keys);	
		res.render('keys', {user: req.user, keys: keys})
	})
})

router.get('/key/:key', auth.presets, function(req, res) {

	async.parallel({
		clicks: function(callback) {
			actions.getClickTrackers(req, res, req.params.key, (err, clickTrackers, hasClickTrackers) => {
				if (!err)
					callback(null, clickTrackers, hasClickTrackers)
			})
		},
		hits: function(callback) {
			actions.getHitTrackers(req, res, req.params.key, (err, hitTrackers, hasHitTrackers) => {
				if (!err)
					callback(null, hitTrackers, hasHitTrackers)
			})
		},
		key: function(callback) {
			actions.getKeyInfo(req, res, req.params.key, (err, ud) => {
				if (!err)
					callback(null, ud)
			})
		}
	}, function(err, arr) {
			res.render('key', {user: req.user, hasClickTrackers: arr.clicks[1], clicktrackers: arr.clicks[0], hasHitTrackers: arr.hits[1], hittrackers: arr.hits[0] ,trackKey: req.params.key, key: arr.key[0]})
	})

})

router.get('/test', function(req, res) {
	res.render('test')
})

router.post('/endpoint/clicks', function(req, res) {
	watcher.incrementClickTrack(req, res, req.body.key, req.body.tracker, (err, result) => {
		trackR = io.of(`/track_${req.body.key}`)
		trackR.emit('change',{
			change: result,
			type: 'click'
		})
		res.send(result)
	})
})

router.post('/endpoint/hits', function(req, res) {
	watcher.incrementHitTrack(req, res, req.body.key, req.body.page, (err, result) => {
		trackR = io.of(`/track_${req.body.key}`)
		trackR.emit('change',{
			change: result,
			type: 'hit'
		})
		res.send(result)
	})
})

router.get('/endpoint/data/clicks', function(req, res) {
	actions.getClickData(req, res, req.query.key, (err, result) => {
		res.send(result)
	})
})

router.get('/endpoint/data/hits', function(req, res) {
	actions.getHitData(req, res, req.query.key, (err, result) => {
		res.send(result)
	})
})

router.post('/endpoint/key/delete', function(req, res) {
	watcher.deleteTracker(req, res, req.body.key, (err, result) => {
		res.send(result)
	})
})

module.exports = router
