'use strict';

var path = process.cwd();
var ObjectId = require('mongodb').ObjectId;


module.exports = function (app, passport, values, display, session, Data) {
	
	app.get('/', function(req, res){
    if (req.user){
        res.redirect('/logged')
    } else {
        res.render('welcome.pug', {title: 'VotingApp', name: 'Please sign in or allow access!', values: values, display: display});
    }
	})

	require('../config/passport')(passport);
	app.use(session({secret: 'mysecret', resave: false, saveUninitialized: false}))
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
	
	app.get('/5*', function(req, res){
    	var keys = [];
    	var votes = [];
    	var str = req.url.substring(1);
    
   

     Data.findOne({_id:ObjectId(str)}).then(function(result){
           for (var key in result.choices){
               keys.push(key);
              votes.push(result.choices[key]);
           }
        if (result.voters.indexOf(req.headers['x-forwarded-for']) > -1){
            var message = 'Thanks for your vote';
            if (req.user){
       res.render('displayPolls-logged.pug', {message: message, name:req.user.name, title:result.title, choices: keys, votes: votes, address: str})
            } else{
        res.render('displayPolls.pug', {message: message, name:'Please sign in or allow access', title:result.title, choices: keys, votes: votes, address: str})
            }
            
        } else{
             message = 'Please vote!'
            if (req.user){
       res.render('displayPolls-logged.pug', {message: message, name:req.user.name, title:result.title, choices: keys, votes: votes, address: str})
            } else{
        res.render('displayPolls.pug', {message: message, name:'Please sign in or allow access', title:result.title, choices: keys, votes: votes, address: str})
            }
        }
    })
});

app.get('/mypolls/*', function(req, res){
    
    //console.log(req.url)
   var str = req.url.substring(9);
   Data.findOne({_id: ObjectId(str)}, function(err, result){
       if (err) throw err;
       var keys = [],
       votes = [];
       for (var key in result.choices){
               keys.push(key);
              votes.push(result.choices[key]);
           }
        if (result.voters.indexOf(req.headers['x-forwarded-for']) > -1){
        var message = 'Thanks for your vote'
        res.render('displayPolls-logged-own.pug', {message: message, name:req.user.name, title:result.title, choices: keys, votes: votes, address: str})
   } else {
        message = 'Please vote'
       res.render('displayPolls-logged-own.pug', {message: message, name:req.user.name, title:result.title, choices: keys, votes: votes, address: str})
   }
      
           
   })
});

app.get('/delete/*', function(req, res){
	Data.findOneAndRemove({_id: ObjectId(req.params[0])}, function(data){
		req.session.valid = null;
		res.redirect('/mypolls')
	})
})

   



app.get('/mypolls', function(req, res){
	req.session.valid = true;
    var value = [];
    var ids = [];
    

   Data.find({user: req.user.id}, function(err, results){

       if (err) throw err;

        results.map(function(val){
            value.push(val.title);
            ids.push(val._id)
        })

       
       res.render('mypolls.pug', {title: 'VotingApp', name: req.user.name, values: values, display: ids});
   })
});

app.post('/save', function(req, res){
    
    console.log(req.body)
    
    
    var options = req.body.options.split(',')
    var choicesObj = new Object();
    options.map(function(val){
        choicesObj[String(val)] = 0;
    })
    
    
    var poll = new Data({
        user: req.user.id,
        title: req.body.title,
        choices: choicesObj,
    })
    poll.save(function(err, data){
        if (err) throw err;

    })
    res.redirect('/' + poll._id)
	})
	
	
	app.get('/vote/*', function(req, res){

	    var str = req.url.substring(6, 30)
	    

Data.findOne({_id:ObjectId(str)}, function(err, result){
    if (err) throw err;
    if (result.voters.indexOf(req.headers['x-forwarded-for']) > -1) {
        var keys = [],
        votes = []
        for (var key in result.choices){
               keys.push(key);
              votes.push(result.choices[key]);
           }
       if (req.user){
       res.render('displayPolls-logged.pug', {message: 'You can only vote once!', name:req.user.name, title:result.title, choices: keys, votes: votes, address: str})
            } else{
        res.render('displayPolls.pug', {message: 'You can only vote once!', name:'Please sign in or allow access', title:result.title, choices: keys, votes: votes, address: str})
            }

    } else {
        var query = decodeURI(req.url).split('/')
	        var str1 = query[query.length -1]
	    var field = 'choices.'+ str1;
	    var ip = req.headers['x-forwarded-for']

	        var conditions = {_id:ObjectId(str)},
	            update = {$inc: {[field] : 1}},
	            voters = {$push: {'voters': ip}}
	    
	   Data.update(conditions, voters, function(){
	       Data.update(conditions, update, function(){
	           res.redirect('/'+str)
	       })
	   })
    }
})
	
});

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
