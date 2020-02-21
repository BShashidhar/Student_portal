var express = require('express');
var router = express.Router();
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var moment = require('moment');
var mongoose = require('mongoose');
var fs = require('fs');
var faculty = require('../models/faculty');
var ModulePaper = require('../models/Questionpaper');
var Result = require('../models/Result');
var QuestionPaper = require('../models/Questionpaper');
var storagePaper = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    var datetimestamp = Date.now();
    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
  }
});

var uploadPapers = multer({
  storage: storagePaper,
  fileFilter: function (req, file, callback) {
    if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1)
      return callback(true);
    else callback(null, true);
  }
}).single('UploadPaper');

/************* paper has been uploaded through the faculty************** */
router.post('/uploadPaper', isLoggedIn, function (req, res) {
  var exceltojson;
  uploadPapers(req, res, function (err) {
    if (err) {
      req.flash('err', 'Error!! Wrong file extension.Only xlsx and xls file accepted!');
      res.redirect('/faculty/Upload');
    }
    else {

      var coursessel = req.body.coursesSel;
      var timeslot = req.body.timeslot;
      var modulesel;
      if(req.body.moduleSel1=="Other")
      {
        modulesel = req.body.moduleSel2+ "-" + req.body.papercode;
      }
      else
      {
        modulesel = req.body.moduleSel1 + "-" + req.body.papercode;
      }
      if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
        exceltojson = xlsxtojson;
      }
      else {
        exceltojson = xlstojson;
      }
      try {
        exceltojson
          (
            {
              input: req.file.path,
              output: null,
              lowerCaseHeaders: true
            },
            function (err, result) {
              if (err) {
                req.flash('err', 'Oops! An error occured while extracting data!!!');
                res.redirect('/faculty/Upload');
              }
              else {
                var questions = [];
                for (var i = 0; i < result.length; i++) {
                  var data = result[i];
                  var question = {
                    _id: Number(data.no),
                    question: data.question,
                    options: [data.option1, data.option2, data.option3, data.option4],
                    answer: data.answer
                  };
                  questions.push(question);
                }
                var modulepaper = new ModulePaper({
                  _id: new mongoose.Types.ObjectId(),
                  timeSlot: timeslot,
                  courseName: coursessel,
                  moduleName: modulesel,
                  questions: questions,
                });
                modulepaper.save();
                req.flash('message', 'Papercode '+modulesel+' has been Uploaded Successfully');
                res.redirect('/faculty/Upload');
              }
            }
          );
      }
      catch (e) {
        console.log("upload file error = " + e);
        req.flash('err', 'Upload file is not added !!!');
        res.redirect('/faculty/Upload');
      }
    }
  });
});
router.get('/Upload', isLoggedIn, function (req, res) {
  var courses = {
    'DAC': ["OOPC", "ADS", "OSC", "DBT", "COREJAVA", "AWT", "MEAN", "J2EE", "ASDM", "MSNET","Other"],
    'DESD': ["C","MCI", "EOS", "RTOS",  "ITMP" ,"EDD","Other"],
    'DBDA': ["SAR","LPCC", "DCDB","BDT", "DV", "PPAA","PML", "OOPJ", "Other"],
    'DIOT': ["FIJW","PT","MP", "EL", "NPWT","DMA","ECP", "CMP", "TACS", "Other" ]
  };
  res.render('faculty/UploadPaper', { courses, message: req.flash('message'), error: req.flash('err') }
  );
});

router.post('/getResult',isLoggedIn,  (req, res) => {
  const { selectcourse, selectmodule } = req.body;
  ModulePaper.findOne({ courseName: selectcourse, moduleName: selectmodule }).exec()
    .then(paper => {
      if (paper) {
        Result.find({ course: selectcourse, module: selectmodule }).exec()
          .then(result => {
            if (result.length !== 0) {
              let studentResults = [];
              result.forEach(student => {
                const { studentid, rollno, name, course, module, answer } = student;
                const studentResult = { studentid, rollno, name, course, module, answer, marks: [], totalMarks: 0 };
                paper.questions.forEach((q, i) => {
                  studentResult.marks.push(answer[i] === q.answer ? 1 : 0)//allocating the mark per question
                  studentResult.totalMarks += studentResult.marks[i];
                });
                studentResults.push(studentResult);
              });
              res.send({ paper, result, studentResults });
            } else {
              res.send({ paper, result: {}, studentResults: [] });
            }
          })
          .catch();
      } else {
        res.send({ paper: {}, result: {}, studentResults: [] });
      }
    })
    .catch();
});

router.get('/result',isLoggedIn,  function (req, res) {
  QuestionPaper.find().exec()
    .then(papercode => {
      
      res.render('faculty/Result', { papercode, result: null, message: req.flash('message'), error: req.flash('err') });
    }).catch(err => console.log(err));
});

router.get('/changepassword', isLoggedIn, function (req, res) {
  res.render('faculty/changepass');
});

router.post('/changepassword', isLoggedIn, function (req, res) {
  var user = req.session.faculty.username;
  var currentpass = req.body.currentpass;
  var pass = req.body.newpass;
  faculty.isAuthenticate(user, currentpass, function (err, result) {
    if (err) {
      res.send(JSON.stringify({ message: '', error: "Current password not matching" }));
    }
    else if (result) {
      faculty.updatePassword(user, pass, function (err, result) {
        if (result) res.send(JSON.stringify({ message: "Password is changed successfully", error: '' }));
        else res.send(JSON.stringify({ message: '', error: "Something is wrong. Try again..!!" }));
      });
    }
  });
});

router.post('/login', function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  faculty.isAuthenticate(user, pass, function (err, result) {
    if (err) {
      req.flash('error', err);
      res.redirect('/faculty');
    } else {
      req.session.faculty = result;
      res.redirect('/faculty/Upload');
    }
  })
});




function isConnectionAvailable() {
  mongoose.connect('mongodb://localhost/cdacstudentportal', { useNewUrlParser: true }, function (err) {
    if (err) console.log("Mongodb connetion problem");
  });
}

/*********** requests ***************/
router.get('/', function (req, res) {
  var err;
  if (!mongoose.connection.readyState) {
    isConnectionAvailable();
    err = "Database connection problem. Please fix the problem!!";
  }
  res.render('faculty/index', { error: req.flash('error'), connerr: err });
});

router.get('/login', function (req, res) {
  res.render('faculty/index', { error: req.flash('error') });
});

router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/faculty');
});



/*******************functions***************************** */
function isLoggedIn(req, res, next) {
  if (req.session.faculty)
    return next();
  else res.redirect('/faculty');
}

module.exports = router;