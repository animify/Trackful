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
	auth.authenticate('github', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/account')
	});

router.get('/login/github', auth.authenticate('github'))

router.use('/login/callback/twitter',
	auth.authenticate('twitter', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/account')
	});

router.get('/login/twitter', auth.authenticate('twitter'))

router.use('/user', authControllers.getUser)
router.use('/logout', authControllers.logout)

module.exports = router
