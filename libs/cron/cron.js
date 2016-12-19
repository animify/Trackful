const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const CronJob = require('cron').CronJob

const r = require(libs + 'db/db')
const async = require('async');
// cronTime: '0 */3 * * *',

var job = new CronJob('0 */1 * * *', function() {

	var d = new Date()
	var epoch = Math.round(d.getTime() / 1000)

	r.db('test_trackers').table('trackers').run((err, rec) => {
		async.forEachOf(rec, function (value, key, callback) {
			console.log(key, rec[key]);
			rv = rec[key]
			r.db('data').table('sloth').insert({id: rec[key].key, type:'data'})
			.run()
			.then((arr) => {
				ta = 0
				ta = Object.keys(rec[key].clicks).map(k => rec[key].clicks[k])
				sum = ta.reduce((a, b) => a + b, 0)
				r.db('data').table('sloth').get(rec[key].key).update({[epoch]: sum}).run()
				console.log(sum)
			})
		}, function (err) {
			if (err) console.error(err.message);
		})
	})

	}, function () {
		/* This function is executed when the job stops */
	},
	true,
	'Europe/London' /* Time zone of this job. */
);
