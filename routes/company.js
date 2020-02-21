var express = require('express');
var router = express.Router();
const fs = require('fs');
var path = require('path');
var multer = require('multer');
var moment = require('moment');
var mongoose = require('mongoose');
var CompanyLogin = require('../models/CompanyLogin');
var Company = require('../models/company');

router.get('/', function (req, res) {
  res.render('company/company', { error: req.flash('error') });
});
router.get('/feedback', isLoggedIn, function (req, res) {
  //var today = new Date();
  var date = new Date();
  var current = moment(date);
  var today = current.format("DD/MM/YYYY");
  //var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  res.render('company/feed', { Date: today, sfbmsg: req.flash('fbinsertmsg') });
});

router.post('/feedback', isLoggedIn, function (req, res) {
  var feedcom = new Company(
    {
      _id: new mongoose.Types.ObjectId(),
      cname: req.body.noc,
      aperson: req.body.noap,
      course: req.body.course,
      compfeedback: [
        req.body.years,
        req.body.recruited,
        req.body.ts,
        req.body.cs,
        req.body.op,
        req.body.rate,
        req.body.activity,
        req.body.nt,
        req.body.suggestions,
        req.body.improvement]
    });
  feedcom.save();
  req.flash('fbinsertmsg', 'Feedback submited successfully...!!');
  res.redirect('/company/feedback');
});

router.post('/login', function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  CompanyLogin.isAuthenticate(user, pass, function (err, result) {
    if (err) {
      req.flash('error', err);
      res.redirect('/company');
    } else {
      req.session.company = result;
      res.redirect('/company/feedback');
    }
  })
});

router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/company');
})

function isLoggedIn(req, res, next) {
  if (req.session.company)
    return next();
  res.redirect('/company');
}

mongoose.connect('mongodb://localhost/cdacstudentportal', { useNewUrlParser: true }, function (err) {
  if (err) console.log("Mongodb connetion problem");
});

module.exports = router;
