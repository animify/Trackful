const express = require('express')
const router = express.Router()

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const watcher = require(libs + '/controllers/watcher')
const actions = require(libs + '/controllers/actions')

const request = require('request')
const fs = require('fs')
const auth = require(libs + 'auth/auth')

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
		if (!err)
			res.send(shortKey)
	})
})

router.get('/key/:key', function(req, res) {
	actions.getTrackers(req, res, req.params.key, (err, trackers, hasKeys) => {
		if (!err)
			res.render('key', {hasKeys: hasKeys, trackers: trackers})
	})
})

router.get('/test', function(req, res) {
	res.render('test')
})

router.post('/test', function(req, res) {
	watcher.incrementClickTrack(req, res, req.body.key, req.body.tracker, (err, result) => {
		res.send(result)
	})
})

module.exports = router
