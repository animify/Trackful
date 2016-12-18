const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
global.socketIO = io
const fs = require('fs')

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const request = require('request').defaults({ encoding: null })
const session = require('express-session')
const RDBStore = require('session-rethinkdb')(session)
const root = require(libs + 'routes/root')

const cron = require(libs + 'cron/cron')

const r = require(libs + 'db/db')

const auth = require(libs + 'auth/auth')
const authRouter = require(libs + 'routes/auth')

const rdbStore = new RDBStore(r, {
	browserSessionsMaxAge: 60000,
	table: 'session'
})

app.use(cookieParser())
	.use(session({
		secret: 'keyboard cat',
		cookie: {
			maxAge: 8460000
		},
		store: rdbStore,
		resave: true,
		saveUninitialized: true
	}))
	.use(auth.initialize())
	.use(auth.session())
	.use(express.static("libs/public"))
	.use(bodyParser())
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: true }))

app.set('port', process.env.PORT || config.get('port') || 80)
	.set('views', __dirname + '/libs/views/modules')
	.set('view engine', 'pug')
	.set('view options', { layout: false })

app.use('/', root)
	.use('/auth', authRouter)

http.listen(app.get('port'), function () {
	log.info('Listening on ' + app.get('port'))
})
