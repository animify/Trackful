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
    },
    activity: (callback) => {
      status.activity(req, res, (err, current) => {
        if (!err)
          callback(null, current)
      })
    }
  }, (err, arr) => {
    res.render('status', {title: "Status - Trackful", data: arr.data, trackers: arr.trackers, users: arr.users, live: arr.live, sessions: arr.sessions, activity: arr.activity})
  })
})

router.get('/account', auth.presets, (req, res) => {
  res.render('account', {user: req.user, title: "Account - Trackful", heading: 'Account preferences', subtype: 'Account'})
})

router.get('/download', function(req, res){
  res.render('download')
})

router.get('/download/js', function(req, res){
  const trackfulJS = libs + '/public/js/trackful.min.js'
  res.download(trackfulJS)
})


router.get('/create/app', auth.presets, (req, res) => {
  res.render('createkey', {user: req.user, title: "Create Project Key - Trackful", heading: 'Create new application', subtype: 'Applications'})
})

router.post('/create/app', auth.presets, (req, res) => {
  actions.createKey(req, res, (err, shortKey) => {
    if (!err) {
      return res.send(shortKey)
    }
    res.json(err)
  })
})

router.get('/apps', auth.presets, (req, res) => {
  actions.getAllKeys(req, res, (err, keys) => {
    res.render('keys', {user: req.user, title: "All Keys - Trackful", keys: keys, heading: 'Your applications', subtype: 'Applications'})
  })
})

router.get('/app/:key/:type*?', auth.presets, (req, res) => {
  actions.validateKeyOwner(req, res, req.params.key, (err, owner) => {
    if (!err && owner && ['activity', 'clicks', 'hits', 'countries', 'devices', 'sessions', undefined].includes(req.params.type)) {

      if (req.params.type === undefined)
        req.params.type = 'dashboard';

      async.parallel({
        trackers: (callback) => {
          actions.getTrackers(req, res, req.params.key, (err, clicksTrackers, hitsTrackers, countriesTrackers, devicesTrackers, sessionTrackers, sessionTime, hasClickTrackers) => {
            if (!err)
              callback(null, clicksTrackers, hitsTrackers, countriesTrackers, devicesTrackers, sessionTrackers, sessionTime, hasClickTrackers)
          })
        },
        key: (callback) => {
          actions.getKeyInfo(req, res, req.params.key, (err, info) => {
            if (!err) callback(null, info)
          })
        },
        activity: (callback) => {
          if (req.params.type == 'activity') {
            actions.getActivity(req, res, req.params.key, (err, activities) => {
              if (!err) callback(null, activities)
            })
          } else {
            callback(null, [false])
          }
        }
      }, (err, arr) => {
        const trackR = io.of(`/track_${req.params.key}`)
        res.render('key', {
          user: req.user,
          title: "Dashboard - Trackful",
          clicktrackers: arr.trackers[0],
          hittrackers: arr.trackers[1],
          countrytrackers: arr.trackers[2],
          devicetrackers: arr.trackers[3],
          sessiontrackers: arr.trackers[4],
          sessiontime: arr.trackers[5],
          hasTrackers: arr.trackers[6],
          trackKey: req.params.key,
          key: arr.key[0],
          heading: arr.key[0].name,
          subtype: req.params.type,
          isKey: true,
          activities: arr.activity,
          page: req.params.type})
      })

    } else {
      res.redirect('/apps')
    }
  })
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

router.post('/endpoint/app/delete', (req, res) => {
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

router.post('/endpoint/session/time', (req, res) => {
  console.log(req.body)
  watcher.sessionTrack(req, res, req.body.key, req.body.page, req.body.ms, (err, result) => {
  log.info(`e - ${result}`)

    if (!err) {

      const trackR = io.of(`/track_${req.body.key}`)
      trackR.emit('change',{
        change: result,
        type: 'session'
      })
      return res.send(result)
    }
    res.send(err)
  })
})

module.exports = router
