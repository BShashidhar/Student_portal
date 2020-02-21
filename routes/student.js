var express = require('express');
var router = express.Router();
const fs = require('fs');
var path = require('path');
var multer = require('multer');
var moment = require('moment');
var mongoose = require('mongoose');
var Student = require('../models/student');
var Notice = require('../models/notice');
var Performance = require('../models/performance');
var Feedback = require('../models/feedback');
var Canteen = require('../models/canteen');
var Gfeedback = require('../models/generalfeedback');
var Attendence = require('../models/attendence');
var QuestionPaper = require('../models/Questionpaper');
var Result = require('../models/Result');
var Company = require('../models/company');

mongoose.connect('mongodb://localhost/cdacstudentportal', { useNewUrlParser: true }, function (err) {
  if (err) console.log("Mongodb connetion problem");
});

/************************exam portal*********************************/
let modules = [];
/***********send the module paper code in the select module tab to the front end i.e. exam.ejs file************************************** */
router.get('/exam', isLoggedIn, function (req, res) {
  var course = req.session.studentDetails.student.course;
  QuestionPaper.find({ courseName: course }).exec()
    .then(questionPapers => {
      modules = questionPapers.map(q => { return q.moduleName });
      res.render('student/exam', {
        modules,
        questionPaper: null,
        submitted: false,
        message: '',
        back:'',
        msg: '',
        error: req.flash('err')
      });
    })
    .catch(err => console.log("Error: ", err));
});

/***********LOad the Question paper for the studnet on the frontend and send the questions to the exam.ejs file*********************************** */
router.post('/questions', isLoggedIn, (req, res) => {
  var paper = req.body.modules.split('-');
  var rollno = req.session.studentDetails.student.rollno;
  var modules = req.body.modules;
  Result.findOne({ module: modules, rollno })
    .then(result => {
      if (result) {
        req.flash('err', 'Your response has been already Submitted');
        res.render('student/exam', {
          modules: null,
          questionPaper: null,
          paper: null,
          submitted: true,
          message: "",
          back: "Back to Home",
          msg:"",
          error: req.flash('err')
        });
      } else {
        QuestionPaper.findOne({ moduleName: req.body.modules }).exec()
          .then(questionPaper => {
            res.render('student/exam', {
              modules: null,
              questionPaper,
              paper,
              submitted: false,
              message: "",
              back: '',
              msg: "",
              error: req.flash('err')
            });
          })
          .catch();
      }
    })
    .catch();
});

/****Storing the answers of the prticular student*******/
router.post('/result',isLoggedIn, (req, res) => {
  var student = req.session.studentDetails.student;
  var answer = req.body;
  var paperCode = req.body.paperCode;
  delete answer.paperCode;
  answers = [];
  for (const key in answer) {
    if (answer.hasOwnProperty(key)) {
      answers.push(answer[key])
    }
  }
  var studentResult = {
    _id: new mongoose.Types.ObjectId(),
    studentid: student._id,
    rollno: student.rollno,
    name: student.name,
    course: student.course,
    module: paperCode,
    answer: answers
  };
  var result = new Result(studentResult);
  result.save();
  res.render('student/exam', {
    modules: null,
    questionPaper: null,
    paper: null,
    submitted: true,
    msg: "Thank you for taking the exam..!!",
    back: "Back to Home",
    message: 'Your response has been successfully recorded',
    error: " "
  });
});
/************************exam portal*********************************/

/*****************this is for fetching data and sending the details which are in the database****************** */
router.get('/comsend',isLoggedIn,  function (req, res) {
  var abc = req.query.inp;
  Company.find({ cname: abc }).exec().then(
    details => {
      d = details;
      res.send(JSON.stringify(d));
    })
});
/********************************************************************** */ 

var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.hour = 13; rule.minute = 59; // rule.second = ;

schedule.scheduleJob(rule, function () {
  var today = moment();
  var tomorrow = moment(today).add(1, 'days');
  var currDate = tomorrow.format("DD/MM/YYYY");
  const can = new Canteen({ date: currDate });
  can.save();
});

router.get('/canteen', isLoggedIn ,function (req, res) {
  var date = new Date();
  var current = moment(date);
  var currDate = current.format("DD/MM/YYYY");
  var list = [];
  Canteen.getDate(currDate, function (err, result) {
    list = result;
    res.render('student/canteenlist', { list: list });
  });
});

const profileURL = './public/images/profiles/';
const profileStorage = multer.diskStorage({
  destination: profileURL,
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + req.session.studentDetails.student._id + ".png");
  }
});

/** chech profile file **/
function checkFileType(file, cb) {
  const filetypes = /jpeg|png|jpg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  else return cb("Images only");
}

const uploadprofile = multer(
  {
    storage: profileStorage,
    limits: { fileSize: 2000000 },
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    }
  }).single('profilepicture');

router.post('/uploadprofile', isLoggedIn, function (req, res) {
  uploadprofile(req, res, (err) => {
    if (err) req.flash('err', err);
    else req.flash('msg', 'File uploaded successfully');
    res.redirect('/student/profile');
  });
});

router.get('/checkCanteen', isLoggedIn, function (req, res) {
  var date = new Date();
  var current = moment(date);
  var currTime = current.format("H");
  var status = false;
  if (currTime >= 14 && currTime < 20) status = true;
  res.send(JSON.stringify({ status: status }));
});

function getCanteen(studentid, callback) {
  Canteen.getDate(function (err, result) {
    if (err || !result) callback(true);
    else if (result.length > 0) {
      var token = -1;
      var len = result.length;
      result[len - 1].list.forEach(student => {
        if (student.studentid == studentid) {
          token = student.registorNumber;
        }
      });
      callback(false, result, token);
    }
  });
}

router.get('/getToken', isLoggedIn, function (req, res) {
  var studentid = req.session.studentDetails.student._id;
  var d = new Date();
  var tomorrow = moment(d).add(1, 'days');
  var today = moment(d);
  var currTime = today.format("H");
  var date = tomorrow.format("YYYY-MM-DD");
  // if(currTime<10) date = today.format("YYYY-MM-DD");
  // if(currTime>15) date = tomorrow.format("YYYY-MM-DD");
  getCanteen(studentid, function (err, result, token) {
    if (err || token == -1) res.send(JSON.stringify({ status: false, date: date }));
    else res.send(JSON.stringify({ status: true, token: token, date: date }));
  });
});

router.get('/registorforcanteen', isLoggedIn, function (req, res) {
  var studentid = req.session.studentDetails.student._id;
  var currDate;
  var date = new Date();
  // if (date.getHours() < 10) {
  //   var current = moment(date);
  //   currDate = current.format("DD/MM/YYYY");
  // } else {
  var today = moment();
  var tomorrow = moment(today).add(1, 'days');
  currDate = tomorrow.format("DD/MM/YYYY");
  // }
  getCanteen(studentid, function (err, result, token) {
    if (token > -1) res.send(JSON.stringify({ status: true, result: 1, token: token }));
    else if (result) {
      Canteen.registor(studentid, currDate, function (err, result) {
        if (err) res.send(JSON.stringify({ status: false }));
        else res.send(JSON.stringify({ status: true, result: 2, token: result }));
      });
    }
    else res.send(JSON.stringify({ status: false }));
  });
});

router.get('/performance', isLoggedIn, function (req, res) {
  var user = req.session.studentDetails.student._id;
  var name = req.session.studentDetails.student.name;
  var course = req.session.studentDetails.student.course;
  var pro;
  var data = [];
  Performance.getPerformance(user, function (err, result) {
    if (err) console.error("Data not found");
    else data = result; //res.render('student/performance',{performance:result});
    const directoryPath = './public/images/profiles/profilepicture-' + user + '.png';
    fs.open(directoryPath, 'r+', function (err, result) {
      if (result) pro = user;
      res.render('student/performance', {
        student: { name: name, user: user, course: course },
        profile: pro,
        performance: data
      });
    });
  });
});

router.post('/getAttByMonth', isLoggedIn, function (req, res) {
  var id = req.session.studentDetails.student._id;
  var month = req.body.month;
  Attendence.getAttByMonth(id, month, function (err, result) {
    req.session.AttendenceByMonth = result.reverse();
    console.log(req.session.AttendenceByMonth)
    res.redirect('/student/attendence');
  });
});

router.get('/attendence', isLoggedIn, function (req, res) {
  var id = req.session.studentDetails.student._id;
  var att = req.session.AttendenceByMonth;
  req.session.AttendenceByMonth = '';
  Attendence.getAttendence(id, function (err, result) {
    var months = [];
    result.forEach(ele => {
      var ds = ele.date.split('-');
      months.push(ds[1]);
    });
    var month = [...new Set(months)];
    res.render('student/attendence', { Attendence: att, month: month });
  });
});



router.post('/midfeedback', isLoggedIn, function (req, res) {
  var course = req.session.studentDetails.student.course;
  var modules = req.body.module;
  var faculty = req.body.faculty;
  var id = req.session.studentDetails.student._id;
  var data = {
    studentid: id,
    preparedness: req.body.preparedness,
    speed: req.body.speed,
    understanding: req.body.understanding,
    response: req.body.response,
    remark: req.body.remark
  }
  Feedback.getFeed(course, modules, function (err, result) {
    if (result) {
      var count = 0;
      var len = result.length;
      result[len - 1].midfeedback.forEach(student => { if (student.studentid == id) count = 1; });
      if (count) {
        req.flash('fbinserterr', "Feedback already submitted..!!");
        res.redirect('/student/feedback');
      } else {
        Feedback.insertMidFeedback(course, modules, faculty, data, function (err, result) {
          if (err) req.flash('fbinserterr', 'Not inserted. Try again..!!');
          else req.flash('fbinsertmsg', 'Feedback submited successfully...!!');
          res.redirect('/student/feedback');
        });
      }
    }
    else {
      req.flash('fbinserterr', "Something wrong. Try after some time..!!");
      res.redirect('/student/feedback');
    }
  });
});

router.post('/feedback', isLoggedIn, function (req, res) {
  var course = req.session.studentDetails.student.course;
  var modules = req.body.module;
  var faculty = req.body.faculty;
  var id = req.session.studentDetails.student._id;
  var data = {
    _id: id,
    studentid: id,
    proficiency: req.body.proficiency,
    communiction: req.body.communiction,
    interaction: req.body.interaction,
    quality: req.body.quality,
    confidence: req.body.confidence,
    labproficiency: req.body.labproficiency,
    assistance: req.body.assistance,
    assignment: req.body.assignment,
    suggestions: req.body.suggestions
  }
  Feedback.getFeed(course, modules, function (err, result) {
    if (result) {
      var count = 0;
      var len = result.length;
      result[len - 1].feedback.forEach(student => { if (student.studentid == id) count = 1; });
      if (count) {
        req.flash('fbinserterr', "Feedback already submitted..!!");
        res.redirect('/student/feedback');
      } else {
        Feedback.insertFeedback(course, modules, faculty, data, function (err, result) {
          if (err) req.flash('fbinserterr', 'Not inserted. Try again..!!');
          else req.flash('fbinsertmsg', 'Feedback submited successfully...!!');
          res.redirect('/student/feedback');
        });
      }
    }
    else {
      req.flash('fbinserterr', "Something wrong. Try after some time..!!");
      res.redirect('/student/feedback');
    }
  });
});

router.post('/generalFeedback', isLoggedIn, function (req, res) {
  var date = new Date();
  var current = moment(date);
  var currDate = current.format("DD/MM/YYYY");
  const gfeed = new Gfeedback({
    course: req.session.studentDetails.student.course,
    studentid: req.session.studentDetails.student._id,
    date: currDate,
    feedback: req.body.generalFeedback
  });
  gfeed.save(err => console.log(err));
  req.flash('gfeedmsg', 'Feedback submitted successfully..!!');
  res.redirect('/student/feedback');
});

router.get('/feedback', isLoggedIn, function (req, res) {
  var companies = [];  
  var modules;
  var course = req.session.studentDetails.student.course;
  var fberr = req.flash('fbinserterr');
  var fbmsg = req.flash('fbinsertmsg');
  var gfbmsg = req.flash('gfeedmsg');
 /*********company feedback start**************** */
  Company.find({}).exec()
    .then(Cdetails => {
      companies =  Cdetails;
      //.map(q => { return q.cname });
    });/*********company feedback ends****** */
  Feedback.getModule(course, function (err, result) {
    var count = 0;
    if (err) console.log(err);
    else {
      try {
        modules = result;
        var len = result.length;
        var mod = result[len - 1].module;
        Feedback.getFeed(course, mod, function (err, result) {
          var id = req.session.studentDetails.student._id;
          if (result) {
            count = 0;
            var len = result.length;
            if (result[len - 1].flag == 0)
              result[len - 1].midfeedback.forEach(student => { if (student.studentid == id) count = 1; });
            else
              result[len - 1].feedback.forEach(student => { if (student.studentid == id) count = 1; });
          }
          res.render('student/feedback', {  companies, module: modules, count: count, fberr: fberr, fbmsg: fbmsg, gfbmsg: gfbmsg });
        });
      } catch (error) {
        modules = undefined;
        res.render('student/feedback', { companies,module: modules, count: count, fberr: fberr, fbmsg: fbmsg, gfbmsg: gfbmsg });
      }
    }
  });
});

router.get('/changepassword', isLoggedIn, function (req, res) {
  res.render('student/changepassword');
});

router.post('/changepassword', isLoggedIn, function (req, res) {
  var user = req.session.studentDetails.student._id;
  var currentpass = req.body.currentpass;
  var pass = req.body.newpass;
  Student.isAuthenticate(user, currentpass, function (err, result) {
    if (err) {
      res.send(JSON.stringify({ message: '', error: "Current password not matching" }));
    }
    else if (result) {
      Student.updatePassword(user, pass, function (err, result) {
        if (result) res.send(JSON.stringify({ message: "Password is changed successfully", error: '' }));
        else res.send(JSON.stringify({ message: '', error: "Something is wrong. Try again..!!" }));
      });
    }
  });
});

router.post('/profile', isLoggedIn, function (req, res) {
  var stud = {
    user: req.session.studentDetails.student._id,
    email: req.body.email,
    contact: req.body.contact,
    dob: req.body.dob,
    education: req.body.education,
    current_address: req.body.current_address,
    parement_address: req.body.parement_address
  }
  Student.updateStudentDetails(stud, function (err, result) {
    if (err || !result) req.flash('updateErr', 'Profile not updated. Try again...!!');
    else if (result) req.flash('updateMsg', 'Profile updated successfully...!!');
    res.redirect('/student/profile');
  });
});

router.get('/profile', isLoggedIn, function (req, res) {
  var user = req.session.studentDetails.student._id;
  var pro;
  Performance.getPerformance(user, function (err, result) {
    if (err) console.error(err);
    else data = result;
    const directoryPath = './public/images/profiles/profilepicture-' + user + '.png';
    fs.open(directoryPath, 'r+', function (err, result) {
      if (result) pro = user;
      res.render('student/profile', {
        profile: pro, msg: req.flash('msg'), err: req.flash('err'), performance: data,
        updatemsg: req.flash('updateMsg'), updateerr: req.flash('updateErr')
      });
    });
  });
});

router.get('/downloadnotice', isLoggedIn, function (req, res) {
  var filename = req.query.notice;
  var file = './public/files/' + filename;
  res.download(file, filename);
});

router.get('/forgotpassword', function (req, res) {
  res.render('student/forgetpass', { error: "0" })
})

router.get('/home', isLoggedIn, function (req, res) {
  var user = req.session.studentDetails.student._id;
  var name = req.session.studentDetails.student.name;
  var course = req.session.studentDetails.student.course;
  var notice, pro;

  Notice.getNoticeByCourse(course, function (err, result) {
    if (err) console.log(err)
    else if (result) notice = result;
    const directoryPath = './public/images/profiles/profilepicture-' + user + '.png';
    fs.open(directoryPath, 'r+', function (err, result) {
      if (result) pro = user;
      res.render('student/home', {
        student: { name: name, user: user, course: course },
        profile: pro,
        noticedata: notice
      });
    });
  });
});

router.get('/login', function (req, res) {
  res.redirect('/student');
});

router.post('/login', function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  Student.isAuthenticate(user, pass, function (err, result) {
    if (err) {
      console.error(err);
      req.flash('loginError', "Invalid username or password..!!");
      res.redirect('/student');
    }
    else if (result) {
      req.session.studentDetails = { "student": result };
      if (result.flag > 0)
        res.redirect('/student/home');
      else res.redirect('/student/home');
    }
  });
});

router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/student');
});

router.get('/', function (req, res) {
  var err;
  var logerr = req.flash('loginError');
  if (!mongoose.connection.readyState || mongoose.connection.readyState == 2) {
    console.log("mongoose.connection.readyState Student = " + mongoose.connection.readyState);
    isConnectionAvailable();
    err = "System problem..We are trying to fix. Please try after some time..!!"
    res.render('student/index', { error: req.flash('loginError'), connerr: err, notice: undefined });
  }
  Notice.getNotice(function (result) {
    res.render('student/index', { error: logerr, connerr: err, notice: result });
  });
});

function isConnectionAvailable() {
  mongoose.connect('mongodb://localhost/cdacstudentportal', { useNewUrlParser: true }, function (err) {
    if (err) console.log("Mongodb connetion problem");
  });
}

function isLoggedIn(req, res, next) {
  if (req.session.studentDetails)
    return next();
  else res.redirect('/student');
}

const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'adminsql',
  server: 'ACTS-WEBSERVER\\SQLEXPRESS',
  database: 'etimetracklite1'
}

var executeQuery = function (query, callback) {
  sql.connect(config, function (err) {
    if (err) {
      console.log("Error while connecting database :- " + err);
      callback(err);
    } else {
      console.log("Sql Conntion Successfull..");

      var request = new sql.Request();
      request.query(query, function (err, result) {
        if (err) {
          console.log("Error while querying database :- " + err);
          callback(err);
        } else {
          callback(false, result);
        }
      });
    }
  });
}
var setRule = new schedule.RecurrenceRule();
setRule.hour = 10; setRule.minute = 00;

schedule.scheduleJob(setRule, function () {
  // router.get('/getAtt', function(req,res) {
  // var month = [ ...new Set(months)];
  var att = new Attendence({
    datestudentid: "date",
    course: "course",
    date: "date",
    studentid: "studentid",
    employeeid: "EmployeeId",
    itime: "inTime",
    otime: "outTime",
    duration: "Duration",
    lateby: "LateBy",
    earlyby: "EarlyBy",
    status: "status",
    punchrecords: "PunchRecords"
  });
  try { att.save(); Attendence.clean(); } catch (e) { console.log("drop problem: " + e) }
  var list = [];
  var course = ["DAC", "DBDA", "DESD", "DIOT"];
  var dac = 1, dbda = 1, diot = 1, desd = 1;
  var dacstart;
  var dbdastart;
  var desdstart;
  var diotstart;
  Student.getAllStudents(function (err, result) {
    result.forEach(stud => {
      if (dac == 1) { if (course[0] == stud.course) { list.push(stud._id); dac++ } }
      if (dbda == 1) { if (course[1] == stud.course) { list.push(stud._id); dbda++ } }
      if (desd == 1) { if (course[2] == stud.course) { list.push(stud._id); desd++ } }
      if (diot == 1) { if (course[3] == stud.course) { list.push(stud._id); diot++ } }
    });
    var l1 = list[0].toString();
    var l2 = list[1].toString();
    var l3 = list[2].toString();
    var l4 = list[3].toString();
    dacstart = l1.substr(0, 9);
    dbdastart = l2.substr(0, 9);
    desdstart = l3.substr(0, 9);
    diotstart = l4.substr(0, 9);
  });

  // var today = new Date();
  // var yesterday = moment(today).subtract(1, 'days');
  // var date = today.format("YYYY-MM-DD");
  // var date = "2019-03-29";
  // var query = "select AttendanceDate, EmployeeId,InTime,OutTime,Duration,LateBy,EarlyBy,PunchRecords,Status from dbo.AttendanceLogs where AttendanceDate='" + date + "T00:00:00.000'";

  var query = "select AttendanceDate, EmployeeId,InTime,OutTime,Duration,LateBy,EarlyBy,PunchRecords,Status from dbo.AttendanceLogs";
  executeQuery(query, function (err, result) {
    try {
      if (err) console.log(err);
      else {
        var addcourse;
        result.recordsets[0].forEach(data => {
          var inTime = data.InTime.split(" ");
          var outTime = data.OutTime.split(" ");
          var d = moment(data.AttendanceDate);
          var date = d.format("YYYY-MM-DD");
          var id = data.EmployeeId.toString();
          var startid = id.substr(0, 1);
          var studentid;
          if (startid == 1) { studentid = dacstart + id.substr(1); addcourse = "DAC" }
          else if (startid == 2) { studentid = desdstart + id.substr(1); addcourse = "DESD" }
          else if (startid == 3) { studentid = diotstart + id.substr(1); addcourse = "DIOT" }
          else if (startid == 4) { studentid = dbdastart + id.substr(1); addcourse = "DBDA" }
          var hour = data.Duration / 60;
          var status = 'Absent';
          if (hour > 4) status = 'Present';
          else if (hour < 4 && hour > 2) status = '½Present';
          var att = new Attendence({
            datestudentid: inTime[0] + studentid,
            course: addcourse,
            date: date,
            studentid: studentid,
            employeeid: data.EmployeeId,
            itime: inTime[1],
            otime: outTime[1],
            duration: data.Duration,
            lateby: data.LateBy,
            earlyby: data.EarlyBy,
            status: status, // status: data.Status,
            punchrecords: data.PunchRecords
          });
          try { att.save(); } catch (e) { "saving problem" + e }
        });
        // res.write(JSON.stringify(result));
      }
    }
    catch (e) {
      console.log("error : " + e)
    }
  });
  res.end();
});
module.exports = router;
