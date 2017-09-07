const libs = `${process.cwd()}/libs/`;
const config = require(`${libs}config`);
const r = require(`${libs}db/db`);

exports.trackers = (req, res, callback) => {
    r
        .db(config.get('rethink').trackDB)
        .table('trackers')
        .limit(1)
        .run((err, cursor) => {
            if (cursor !== undefined) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
};

exports.users = (req, res, callback) => {
    r
        .db('users')
        .table('users')
        .limit(1)
        .run((err, cursor) => {
            if (cursor !== undefined) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
};

exports.data = (req, res, callback) => {
    r
        .db('data')
        .table('sloth')
        .limit(1)
        .run((err, cursor) => {
            if (cursor !== undefined) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
};

exports.sessions = (req, res, callback) => {
    r
        .db('users')
        .table('session')
        .limit(1)
        .run((err, cursor) => {
            if (cursor !== undefined) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
};

exports.activity = (req, res, callback) => {
    r
        .db('data')
        .table('activity')
        .limit(1)
        .run((err, cursor) => {
            if (cursor !== undefined) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
};

exports.live = (req, res, callback) => {
    if (global.socketIO !== undefined) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};
