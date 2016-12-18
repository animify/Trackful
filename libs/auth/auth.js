const libs = process.cwd() + '/libs/'

const config = require(libs + 'config')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy
const TwitterStrategy = require('passport-twitter').Strategy
const r = require('rethinkdbdash')()

const rUsers = r.db('users').table('users')

passport.serializeUser(function (user, done) {
	return done(null, user.id)
})

passport.deserializeUser(function (id, done) {
	rUsers
		.get(id)
		.run()
		.then(function (user) {
			done(null, user)
		})
})

const loginCallbackHandler = function (objectMapper, type) {
	return function (accessToken, refreshToken, profile, done) {
		if (accessToken !== null) {
			rUsers
				.filter({login: profile.username, type: type, [`${type}ID`]: profile.id})
				.run()
				.then((users) => {
					if (users.length > 0) {
						return done(null, users[0])
					}
					return rUsers
						.insert(objectMapper(profile))
						.run()
						.then(function (response) {
							return rUsers
								.get(response.generated_keys[0])
								.run()
						})
						.then(function (newUser) {
							done(null, newUser)
						})
				})
		}
	}
}

const callbackURL = 'http://' + config.get('url') + ':' + config.get('port') + '/auth/login/callback'

passport.use(new GitHubStrategy({
		clientID: config.get('github').clientID,
		clientSecret: config.get('github').clientSecret,
		callbackURL: callbackURL + '/github'
	},
	loginCallbackHandler(function (profile) {
		return {
			'login': profile.username,
			'name': profile.displayName || null,
			'githubID': profile.id,
			'url': profile.profileUrl,
			'avatarUrl': profile._json.avatar_url,
			'type': 'github',
			'keys': []
		}
	}, 'github')
))

passport.use(new TwitterStrategy({
		consumerKey: config.get('twitter').consumerKey,
		consumerSecret: config.get('twitter').consumerSecret,
		callbackURL: callbackURL + '/twitter'
	},
	loginCallbackHandler(function (profile) {
		return {
			'login': profile.username,
			'name': profile.displayName || null,
			'twitterID': profile.id,
			'url': profile._raw.expanded_url || null,
			'avatarUrl': profile._json.profile_image_url,
			'type': 'twitter',
			'keys': []
		}
	}, 'twitter')
))

passport.presets = function (req, res, next) {
	if (req.user) {
		if (req.user.keys.length < 1 && req.originalUrl != '/create/key')
			return res.redirect('/create/key')
		// else if (req.user.keys.length > 0 && req.originalUrl == '/create/key')
		// 	return res.redirect('/account')

		return next()
	}
	return res.redirect('/not')
}

module.exports = passport