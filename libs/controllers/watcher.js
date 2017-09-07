const libs = `${process.cwd()}/libs/`;
const config = require(`${libs}config`);
const r = require(`${libs}db/db`);
const actions = require(`${libs}controllers/actions`);
const url = require('url');
const async = require('async');
const geoip = require('geoip-lite');
const countries = require('country-data').countries;

exports.sessionTrack = (req, res, key, href, ms, callback) => {
    const preUrl = url.parse(href);
    const page = preUrl.pathname + (preUrl.search != null ? preUrl.search : '') + (preUrl.hash != null ? preUrl.hash : '');
    const originUrl = url.parse(req.headers.origin);
    const originHost = originUrl.host;

    r
        .db(config
            .get('rethink').trackDB)
        .table('trackers')
        .filter({
            key,
            domain: originHost,
            status: 'active'
        })
        .update({
            sessions: {
                [page]: r.row('sessions')(page).default(0).add(ms) }
        },
        { returnChanges: true })
        .run((err, cursor) => {
            if (cursor.changes) { return callback(null, [page, ms]); }

            callback(true, null);
        });
};

exports.incrementClickTrack = (req, res, key, track, callback) => {
    const originUrl = url.parse(req.headers.origin);
    const originHost = originUrl.host;

    async.parallel({
        activity: (next) => {
            actions.addActivity(req, res, key, 'click', track, null, null, null, (err, current) => {
                if (!err) return next(null, current);
                next(true, null);
            });
        },
        tracker: (next) => {
            r
                .db(config.get('rethink').trackDB)
                .table('trackers')
                .filter({
                    key,
                    domain: originHost,
                    status: 'active'
                })
                .update({
                    clicks: {
                        [track]: r.row('clicks')(track).default(0).add(1) }
                },
                { returnChanges: true })
                .run((err, cursor) => {
                    if (cursor.changes) {
                        if (cursor.changes[0] === undefined) { return next(true, null); }

                        return next(null, [track, cursor.changes[0].new_val.clicks[track]]);
                    }
                    next(true, null);
                });
        }
    }, (err, arr) => {
        if (err) { return callback(err, null); }

        callback(null, arr.tracker);
    });
};

exports.incrementHitTrack = (req, res, key, href, callback) => {
    const preUrl = url.parse(href);
    const originUrl = url.parse(req.headers.origin);
    const originHost = originUrl.host;
    const page = preUrl.pathname + (preUrl.search != null ? preUrl.search : '') + (preUrl.hash != null ? preUrl.hash : '');
    const device = `${req.device.type}/${req.device.name}`;
    // const geo2 = geoip.lookup(req.ip);
    const geo = geoip.lookup('91.184.210.191');

    const country = (geo == null) ? 'Other' : countries[geo.country].name;
    const city = (geo == null) ? 'Other' : geo.city;

    async.parallel({
        activity: (next) => {
            actions.addActivity(req, res, key, 'hit', null, page, city, country, device, (err, current) => {
                if (!err) return next(null, current);
                next(true, null);
            });
        },
        tracker: (next) => {
            r
                .db('test_trackers')
                .table('trackers')
                .filter({
                    key,
                    domain: originHost,
                    status: 'active'
                })
                .update({
                    hits: {
                        [page]: r.row('hits')(page).default(0).add(1)
                    },
                    countries: {
                        [country]: r.row('countries')(country).default(0).add(1)
                    },
                    devices: {
                        [device]: r.row('devices')(device).default(0).add(1)
                    }
                },
                { returnChanges: true }
                )
                .run((err, cursor) => {
                    if (cursor.changes) {
                        const cr = {};
                        cr.page = [page, cursor.changes[0].new_val.hits[page]];
                        cr.countries = [country, cursor.changes[0].new_val.countries[country]];
                        cr.devices = [device, cursor.changes[0].new_val.devices[device]];
                        return next(null, cr);
                    }

                    return next(true, null);
                });
        }
    }, (err, arr) => {
        if (err) { return callback(err, null); }

        return callback(null, arr.tracker);
    });
};

exports.deleteTracker = (req, res, key, callback) => {
    r
        .db('users')
        .table('users')
        .update(row => ({
            keys: row('keys').filter(item => item('id').ne(key))
        }),
        { returnChanges: true })
        .run((err, cursor) => {
            if (cursor.replaced) {
                r
                    .db('test_trackers')
                    .table('trackers')
                    .filter({ key })
                    .delete()
                    .run();

                r
                    .db('data')
                    .table('sloth')
                    .filter({ key })
                    .delete()
                    .run();

                return callback(null, true);
            }

            callback(true, null);
        });
};
