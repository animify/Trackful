const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

const CronJob = require('cron').CronJob

const r = require(libs + 'db/db')
// cronTime: '0 */3 * * *',

var job = new CronJob('*/2 * * * *', function() {



	}, function () {
		/* This function is executed when the job stops */
	},
	true,
	'Europe/London' /* Time zone of this job. */
);


var d = new Date()
var epoch = Math.round(d.getTime() / 1000)

r.db('test_trackers').table('trackers').run((err, rec) => {
	for (v in rec) {
		r.db('data').table('sloth').insert({id: rec[v].key, [epoch]: epoch})
		.run((err, arr) => {
			console.log(arr);
			let ta = Object.keys(rec[v].clicks).map(k => rec[v].clicks[k])
			sum = ta.reduce((a, b) => a + b, 0)
			r.db('data').table('sloth').get(rec[v].key).update({sum: sum}).run()
			console.log(sum);
		})
	}
})
