const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const CronJob = require('cron').CronJob

const r = require(libs + 'db/db')
const async = require('async')
// cronTime: '0 */3 * * *',

const job = new CronJob('* * * * *', function() {
	const d = new Date()
	const epoch = Math.round(d.getTime() / 1000)

	r.db('test_trackers').table('trackers').run((err, rec) => {
		async.forEachOf(rec, function (value, key, callback) {
			rv = rec[key]
			r.db('data').table('sloth').insert({id: rec[key].key, type:'data', hits: [], clicks: []})
			.run()
			.then((arr) => {
				clicksArray = Object.keys(rec[key].clicks).map(k => rec[key].clicks[k])
				clicksSum = clicksArray.reduce((a, b) => a + b, 0)

				hitsArray = Object.keys(rec[key].hits).map(k => rec[key].hits[k])
				hitsSum = hitsArray.reduce((a, b) => a + b, 0)

				r.db('data').table('sloth').get(rec[key].key).update(
					{clicks: r.row('clicks').append({[epoch]: clicksSum}), hits: r.row('hits').append({[epoch]: hitsSum})}
				).run((err, aa) => {
					console.log(aa)
				})
				console.log(clicksSum)
				console.log(hitsSum)
			})
		}, (err) => {
			if (err) console.error(err.message)
		})
	})

	},
	true,
	'Europe/London'
)
