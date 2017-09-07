const r = require('rethinkdbdash')({
    db: 'users'
});

module.exports = r;
