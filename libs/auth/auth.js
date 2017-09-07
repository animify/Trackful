const libs = `${process.cwd()}/libs/`;
const config = require(`${libs}config`);
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const r = require('rethinkdbdash')();

const rUsers = r.db('users').table('users');

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
    rUsers
        .get(id)
        .run()
        .then(user => done(null, user));
});

const loginCallbackHandler = function login(objectMapper, type) {
    return (accessToken, refreshToken, profile, done) => {
        if (accessToken !== null) {
            rUsers
                .filter({
                    login: profile.username,
                    type,
                    [`${type}ID`]: profile.id,
                })
                .run()
                .then((users) => {
                    if (users.length > 0) { return done(null, users[0]); }

                    return rUsers
                        .insert(objectMapper(profile))
                        .run()
                        .then(response => rUsers
                            .get(response.generated_keys[0])
                            .run())
                        .then(newUser => done(null, newUser));
                });
        }
    };
};

const callbackURL = `https://${(process.env.NODE_ENV === 'development') ? config.get('url') : config.get('production_url')}:${config.get('port')}/auth/login/callback`;

passport.use(
    new GitHubStrategy(
        {
            clientID: (process.env.NODE_ENV === 'development') ? config.get('github_dev').clientID : config.get('github').clientID,
            clientSecret: (process.env.NODE_ENV === 'development') ? config.get('github_dev').clientSecret : config.get('github').clientSecret,
            callbackURL: `${callbackURL}/github`,
        },
        loginCallbackHandler(profile => ({
            login: profile.username,
            name: profile.displayName || null,
            githubID: profile.id,
            url: profile.profileUrl,
            avatarUrl: profile._json.avatar_url,
            type: 'github',
            keys: []
        }), 'github')
    )
);

passport.use(new TwitterStrategy({
    consumerKey: (process.env.NODE_ENV === 'development') ? config.get('twitter_dev').consumerKey : config.get('twitter').consumerKey,
    consumerSecret: (process.env.NODE_ENV === 'development') ? config.get('twitter_dev').consumerSecret : config.get('twitter').consumerSecret,
    callbackURL: `${callbackURL}/twitter`,
},
loginCallbackHandler(profile => ({
    login: profile.username,
    name: profile.displayName || null,
    twitterID: profile.id,
    url: profile._raw.expanded_url || null,
    avatarUrl: profile._json.profile_image_url,
    type: 'twitter',
    keys: [],
}), 'twitter')
));

passport.presets = (req, res, next) => {
    if (req.user) {
        if (req.user.keys.length < 1 && req.originalUrl !== '/create/app') {
            return res.redirect('/create/app');
        }
        return next();
    }

    return res.redirect('/');
};

module.exports = passport;
