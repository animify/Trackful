var nconf = require('nconf');

nconf.argv()
	.env()
	.file({
		file: process.cwd() + '/libs/configs/settings.json'
	});

module.exports = nconf;
