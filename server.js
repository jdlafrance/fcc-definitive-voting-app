'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var ObjectId = require('mongodb').ObjectId;
var db = mongoose;
var app = express();
var Schema = db.Schema;


app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

require('dotenv').load();

db.connect(process.env.MONGO_URI);
app.use(express.static('public'))

db.connection.on('error', function(){
    console.log('error');
})



db.connection.on('open', function(){
    var dataSchema = new Schema ({
    user: Number,
    title: String,
    choices: Object,
    voters: Array
    }, {collection: 'polls'})
  

    var Data = db.model('data', dataSchema)


    var ids = [];
    var values = [];
    Data.find(function(err, datas){
        if (err) throw err;
            
            datas.forEach(function(val){
                values.push(val.title);
                ids.push(val._id)
            })
     
        })

    routes(app, passport, values, ids, session, Data);
    
    

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



   



app.get('/mypolls', function(req, res){
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
});

var port = process.env.PORT || 8080;
    app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});