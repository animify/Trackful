"use strict"

const express = require('express')
const app = express()
const fs = require('fs')
const addRequestId = require('express-request-id')()

const credentials = {
  key: (process.env.NODE_ENV == 'development') ? fs.readFileSync('ssl/localhost.key') : fs.readFileSync('ssl/trackful_io.key'),
  cert: (process.env.NODE_ENV == 'development') ? fs.readFileSync('ssl/localhost.crt') : fs.readFileSync('ssl/trackful_io.crt')
}

app.locals.moment = require('moment')
process.env.NODE_ENV == 'development' ? app.locals.env = 'development' : app.locals.env = 'production'

const http = require('http').Server(app)
const https = require('https').Server(credentials, app)
const io = require('socket.io')(https)
global.socketIO = io

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const request = require('request').defaults({ encoding: null })
const session = require('express-session')
const RDBStore = require('session-rethinkdb')(session)
const device = require('express-device')
const cors = require('cors')
const helmet = require('helmet')

const root = require(libs + 'routes/root')
const cron = require(libs + 'cron/cron')

const r = require(libs + 'db/db')

const auth = require(libs + 'auth/auth')
const authRouter = require(libs + 'routes/auth')

const rdbStore = new RDBStore(r, {
  browserSessionsMaxAge: 600000,
  table: 'session'
})

let ensureSecure = (req, res, next) => {
  if(req.secure){
    return next()
  }
  res.redirect('https://' + req.hostname + req.url)
}

app.all('*', ensureSecure)

app.set('trust proxy', true)

app.enable('trust proxy')

app.use(cookieParser())
  .use(helmet())
  .use(addRequestId)
  .use(session({
    secret: 'keyboard cat',
    cookie: {
      maxAge: 84600000
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
  .use(device.capture({ parseUserAgent : true }))
  .use(cors())

app.set('port', process.env.PORT || config.get('port') || 443)
  .set('http_port', config.get('http_port') || 3000)
  .set('views', __dirname + '/libs/views/modules')
  .set('view engine', 'pug')
  .set('view options', { layout: false })

app.use('/', root)
  .use('/auth', authRouter)


app.use((req, res, next) => {
  res.status(404)

  if (req.accepts('html')) return res.render('404')

  if (req.accepts('json')) return res.send({ error: 404, message: 'Trackful: Page not found' })

  res.type('txt').send('Trackful 404: Page not found')
})

http.listen(app.get('http_port'), function () {
  log.info('Trackful server running on port: ' + app.get('http_port'))
})

https.listen(app.get('port'), function () {
  log.info('Trackful server running on port: ' + app.get('port'))
})
