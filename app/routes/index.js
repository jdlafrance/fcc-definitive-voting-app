'use strict';

var path = process.cwd();
var ObjectId = require('mongodb').ObjectId;


module.exports = function (app, passport, values, display, session) {
	
	app.get('/', function(req, res){
    if (req.user){
        res.redirect('/logged')
    } else {
        res.render('welcome.pug', {title: 'VotingApp', name: 'Please sign in or allow access!', values: values, display: display});
    }
	})

require('../config/passport')(passport);
app.use(session({secret: 'mysecret', resave: true, saveUninitialized: true}))
app.use(passport.initialize());
app.use(passport.session());


	app.get('/auth/facebook',
		passport.authenticate('facebook'), function(req, res, next) {
		    console.log(req.user)
		});
	
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/logged',
			failureRedirect: '/'
		}))
		

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/');
		}
	}

	app.get('/logged', isLoggedIn, function (req, res, next) {
			res.render('welcome-logged.pug', {title: 'VotingApp', name: req.user.name, values: values, display: display});
		});
		
	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});
	app.get('/newpoll', isLoggedIn, function(req, res, next){
		res.render('newpoll.pug', {title: 'VotingApp', name: req.user.name});
	})

/*
	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});

	app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			res.json(req.user.github);
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/login'
		}));
*/

};
