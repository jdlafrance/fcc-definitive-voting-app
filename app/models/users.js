'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var ObjectId = mongoose.Types.ObjectId('10154578907506062');

/*
var User = new Schema({
	github: {
		id: String,
		displayName: String,
		username: String,
      publicRepos: Number
	},
   nbrClicks: {
      clicks: Number
   },
});
*/

var User = mongoose.model('User', {
  oauthID: Number,
  id: Number,
  name: String,
  created: Date,
});



module.exports = User




//module.exports = mongoose.model('fbs', FacebookUser);

//module.exports = mongoose.model('User', User);
