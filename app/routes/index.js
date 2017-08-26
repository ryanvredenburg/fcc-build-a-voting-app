'use strict';

var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var Poll = require('../models/polls');
var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');



module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/login');
		}
	}

	var clickHandler = new ClickHandler();

	app.route('/')
		.get( function (req, res) {
			res.render('index', {isAuthenticated: req.isAuthenticated()});
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/login');
		});

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
   
  app.route('/newPoll')
		.get(isLoggedIn, function (req, res) {
			res.render('newPoll', {isAuthenticated: req.isAuthenticated()});
		})
    .post(isLoggedIn, function (req, res) {
      var rawOptions = req.body.options.split(/\r|\n/);
      var options = []
      for (var i = 0; i < rawOptions.length; i++){
        if (rawOptions[i] != ""){
          options.push({name:rawOptions[i], votes:0});
        }
      }
      var newPoll = new Poll({question:req.body.question, options:options})
      newPoll.creator_id = req.user.id;
      newPoll.save(function (err) {
        if (err) throw err;
        res.redirect('/polls');
      });
 
		});
    app.route('/polls/:pollId')
		.get( function (req, res) {
			Poll.findOne({_id:req.params.pollId}, function (error, poll){
        var chartData = [];
        var chartLabels = [];
        for (var i = 0; i<poll.options.length; i++){
          chartData.push(poll.options[i].votes)
          chartLabels.push("'"+poll.options[i].name+"'")
        }
        res.render('poll', {poll: poll, chartData:chartData, chartLabels:chartLabels, isAuthenticated: req.isAuthenticated()});
      });
		})
    .post( function (req, res) {
      Poll.findOne({_id:req.params.pollId}, function (error, poll){
        if (error) throw error;
        for (var i=0; i<poll.options.length;i++){
          if (poll.options[i]._id == req.body.voteOption){
            poll.options[i].votes++;
            poll.votes++;
          }
        }
        poll.save(function (err) {
        if (err) throw err;
        res.redirect('/polls/'+req.params.pollId);
      });
        
        })
      });
    
   app.route('/polls/delete/:pollId')
		.get(isLoggedIn, function (req, res) {
			Poll.findOne({_id:req.params.pollId}, function (error, poll){
        if (error) throw error;
        if (poll.creator_id == req.user.id){
          poll.remove();
          res.redirect( '/myPolls')
        } else {
          res.json({error: 'You cannot delete other users polls'})
        }
      });
		})
  
    app.route('/polls/addoptions/:pollId')
    .post(isLoggedIn, function (req, res) {
      Poll.findOne({_id:req.params.pollId}, function (error, poll){
        if (error) throw error;
        var rawOptions = req.body.options.split(/\r|\n/);
        var options = []
        for (var i = 0; i < rawOptions.length; i++){
          if (rawOptions[i] != ""){
            poll.options.push({name:rawOptions[i], votes:0});
          }
        }
        poll.save();
        res.redirect('/polls/' + req.params.pollId);
        }); 
		});
  
  app.route('/polls')
		.get( function (req, res) {
			Poll.find({}, function (error, poll){
        res.render('polls', {polls: poll, isAuthenticated: req.isAuthenticated()});
      });
		});
  
    app.route('/myPolls')
		.get(isLoggedIn,  function (req, res) {
			Poll.find({creator_id:req.user.id}, function (error, poll){
        res.render('polls', {polls: poll, isAuthenticated: req.isAuthenticated()});
      });
		});


	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
};
