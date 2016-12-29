"use strict"

const express = require('express')
const router = express.Router()

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const request = require('request')
const fs = require('fs')

const auth = require(libs + 'auth/auth')
const authControllers = require(libs + 'controllers/auth')

router.use('/login/callback/github',
	auth.authenticate('github', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/keys/all')
	});

router.get('/login/github', auth.authenticate('github'))

router.use('/login/callback/twitter',
	auth.authenticate('twitter', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/keys/all')
	});

router.get('/login/twitter', auth.authenticate('twitter'))

router.use('/user', authControllers.getUser)
router.use('/logout', authControllers.logout)

module.exports = router
