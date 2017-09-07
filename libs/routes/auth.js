const express = require('express');

const router = express.Router();

const libs = `${process.cwd()}/libs/`;

const auth = require(`${libs}auth/auth`);
const authControllers = require(`${libs}controllers/auth`);

router.use('/login/callback/github',
    auth.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/apps');
    });

router.get('/login/github', auth.authenticate('github'));
router.get('/login/twitter', auth.authenticate('twitter'));

router.use('/login/callback/twitter',
    auth.authenticate('twitter', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/apps');
    });

router.use('/user', authControllers.getUser);
router.use('/logout', authControllers.logout);

module.exports = router;
