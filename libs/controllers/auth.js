"use strict"

let authController = {}

authController.getUser = function (req, res) {
	if (req.user && req.user.id) {
		res.json(req.user)
		return
	}
	res.status(400).json(null)
}
authController.logout = function (req, res) {
	req.logout()
	req.session.destroy()
	res.redirect('/')
}

authController.login = function (req, res) {
	res.redirect('/accounting')
}

module.exports = authController
