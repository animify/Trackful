const libs = `${process.cwd()}/libs/`;
// const log = require(`${libs}logs/log`)(module);
const config = require(`${libs}config`);
const r = require('../db/db');

const shortid = require('shortid');
const url = require('url');
const request = require('request');

exports.updateAvatar = (req, res, imageurl, callback) => {
    if (imageurl) {
        const magic = {
            jpg: 'ffd8ffe0',
            png: '89504e47',
            gif: '47494638',
        };

        const o = {
            method: 'GET',
            url: imageurl,
            encoding: null,
        };

        request(o, (err, response, body) => {
            if (!err && response.statusCode === 200) {
                const isMagic = body.toString('hex', 0, 4);
                if (isMagic === magic.jpg || isMagic === magic.png || isMagic === magic.gif) {
                    r
                        .db('users')
                        .table('users')
                        .filter({ id: req.user.id })
                        .update({ avatarUrl: imageurl }, { returnChanges: true })
                        .run((e, cursor) => {
                            if (cursor.changes) {
                                return callback(null, true);
                            }

                            callback({
                                status: 404,
                                message: 'Invalid input',
                            }, null);
                        });
                }
            } else {
                callback({
                    status: 404,
                    message: 'Invalid image URL',
                    element: 'avatarUrl',
                }, null);
            }
        });
    }
};

exports.validateKeyOwner = (req, res, key, callback) => {
    if (key) {
        r
            .db('users')
            .table('users')
            .filter({ id: req.user.id })
            .filter(row => row('keys').contains(k => k('id').eq(key)))
            .run((err, cursor) => {
                if (cursor[0] !== undefined) {
                    callback(null, true);
                }
                callback(true, null);
            });
    } else {
        callback({
            status: 404,
            message: 'Invalid input',
        }, null);
    }
};

exports.createKey = (req, res, callback) => {
    const shortKey = shortid.generate();
    const preUrl = url.parse(req.body.domain);
    const d = new Date();
    const epoch = Math.round(d.getTime() / 1000);

    if (req.body.name === '') {
        return callback({
            status: 500,
            message: 'The name for your application cant be blank',
            element: 'appname',
        }, null);
    }

    if (!preUrl.host) {
        return callback({
            status: 500,
            message: 'Please enter a valid full URL as your domain name e.g http://yourdomain.com',
            element: 'domain',
        }, null);
    }

    r
        .table('users')
        .get(req.user.id)
        .update({
            keys: r
                .row('keys')
                .append({
                    id: shortKey,
                    name: req.body.name,
                    domain: preUrl.host,
                    created: r.now().toEpochTime(),
                }),
        })
        .run(() => {
            r
                .db('data')
                .table('sloth')
                .insert({
                    id: shortKey,
                    type: 'data',
                    hits: [{ [epoch]: 0 }],
                    clicks: [{ [epoch]: 0 }],
                })
                .run();

            r
                .db(config.get('rethink').trackDB)
                .table('trackers')
                .insert({
                    key: shortKey,
                    clicks: {},
                    hits: {},
                    countries: {},
                    devices: {},
                    domain: preUrl.host,
                    status: 'active',
                })
                .run((err) => {
                    if (err) {
                        return callback({
                            status: 500,
                            message: 'Something went wrong',
                        }, null);
                    }

                    return callback(null, shortKey);
                });
        });
};

exports.getAllKeys = (req, res, callback) => {
    r
        .table('users')
        .get(req.user.id)('keys')
        .run((err, userKeys) => {
            const keyArr = Object.keys(userKeys).map(k => userKeys[k]);
            callback(null, keyArr);
        });
};

exports.getKeyInfo = (req, res, key, callback) => {
    r
        .table('users')
        .get(req.user.id)('keys')
        .filter({ id: key })
        .run((err, keyData) => {
            callback(null, keyData);
        });
};

exports.getTrackers = (req, res, key, callback) => {
    r
        .db(config.get('rethink').trackDB)
        .table('trackers')
        .filter({ key })
        .run((err, rest) => {
            let hasTrackers = false;
            let sessionTime = 0;

            if (rest[0]) {
                if (Object.keys(rest[0].clicks).length > 0
                    || Object.keys(rest[0].hits).length > 0
                    || Object.keys(rest[0].countries).length > 0
                    || Object.keys(rest[0].devices).length > 0) {
                    hasTrackers = true;
                    if (rest[0].sessions) {
                        const sessionTimeArray = Object.keys(rest[0].sessions).map(k => rest[0].sessions[k]);
                        sessionTime = sessionTimeArray.reduce((a, b) => a + b, 0);
                    }
                }

                return callback(null, rest[0].clicks, rest[0].hits, rest[0].countries, rest[0].devices, rest[0].sessions, sessionTime, hasTrackers);
            }
            callback(null, true);
        });
};

exports.addActivity = (req, res, key, type, element, page, city, country, device, callback) => {
    r
        .db('data')
        .table('activity')
        .insert({
            key,
            type,
            element,
            page,
            city,
            country,
            device,
            time: r.now().toEpochTime()
        }).run((err, cursor) => {
            if (cursor) { return callback(null, true); }

            callback(true, null);
        });
};

exports.getActivity = (req, res, key, callback) => {
    r
        .db('data')
        .table('activity')
        .filter({ key })
        .orderBy(r.desc('time'))
        .limit(80)
        .run((err, cursor) => {
            if (cursor) { return callback(null, cursor); }

            callback(true, null);
        });
};

exports.getClickData = (req, res, key, callback) => {
    r
        .db('data')
        .table('sloth')
        .get(key)
        .run((err, rest) => {
            if (rest != null) {
                let dataArray = Object.keys(rest.clicks).map(k => rest.clicks[k]);
                if (dataArray.length > 22) { dataArray = dataArray.slice(dataArray.length - 21, dataArray.length - 1); }

                return callback(null, dataArray);
            }
            callback(null, rest);
        });
};

exports.getHitData = (req, res, key, callback) => {
    r
        .db('data')
        .table('sloth')
        .get(key)
        .run((err, rest) => {
            if (rest != null) {
                let dataArray = Object.keys(rest.hits).map(k => rest.hits[k]);
                if (dataArray.length > 22) { dataArray = dataArray.slice(dataArray.length - 21, dataArray.length - 1); }

                return callback(null, dataArray);
            }
            callback(null, rest);
        });
};
