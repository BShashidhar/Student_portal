var express = require('express');
var router = express.Router();
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var moment = require('moment');
var mongoose = require('mongoose');
var fs = require('fs');

var Student = require('../models/student');
var Performance = require('../models/performance');
var Admin = require('../models/admin');
var Notice = require('../models/notice');
var Canteen = require('../models/canteen');
var Feedback = require('../models/feedback');
var Gfeedback = require('../models/generalfeedback');
var Company = require('../models/company');

/***************** xlsx file setting start ***************/
//multers disk storage settings
var storageStudents = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    var datetimestamp = Date.now();
    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
  }
});

var uploadStudents = multer({
  storage: storageStudents,
  fileFilter: function (req, file, callback) {
    if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1)
      return callback(true);
    else callback(null, true);
  }
}).single('studentList');

// Upload Student List
router.post('/uploadStudentList', isLoggedIn, function (req, res) {
  var exceltojson;
  uploadStudents(req, res, function (err) {
    if (err) {
      req.flash('err', 'Error!! Wrong file extension.Only xlsx and xls file accepted!');
      res.redirect('/admin/home');
    }
    else {

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
            }
            ,
            function (err, result) {
              if (err) {
                req.flash('err', 'Oops! An error occured while extracting data!!!');
                res.redirect('/admin/home');
              }
              else {
                for (var i = 0; i < result.length; i++) {
                  var data = result[i];
                  var student = new Student({ _id: Number(data.prn), rollno: Number(data.rollno), name: data.name, password: data.prn, course: data.course, flag: 0 });
                  student.save();
                  var performance = new Performance({ _id: data.prn, course: data.course });
                  performance.save();
                }
                req.flash('message', 'List is uploaded successfully');
                res.redirect('/admin/home');
              }
            }
          );
      }
      catch (e) {
        console.log("Student list error = " + e);
        req.flash('err', 'Student List is not added !!!');
        res.redirect('/admin/home');
      }
    }
  });
});

// var uploadMarks = multer({
//   storage: storageStudents,
//   fileFilter: function (req, file, callback) {
//     if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1)
//       return callback(true);
//     else callback(null, true);
//   }
// }).single('Marks');
// Upload Student Marks
router.post('/uploadmarks', isLoggedIn, function (req, res) {
  var exceltojson;
  uploadStudents(req, res, function (err) {
    if (err) {
      req.flash('error', 'Error!! Wrong file extension.Only xlsx and xls file accepted!');
      res.redirect('/admin/result');
    }
    else {
      if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
        exceltojson = xlsxtojson;
      } else {
        exceltojson = xlstojson;
      }
      try {
        exceltojson({
          input: req.file.path,
          output: null, //since we don't need output.json
          lowerCaseHeaders: true
        }, function (err, result) {
          if (err) {
            req.flash('error', 'Oops! An error occured while extracting data!!!');
            res.redirect('/admin/result');
          }
          else {
            for (var i = 0; i < result.length; i++) {
              var data = result[i];
              var mark = {
                "module": data.module,
                "lab": data.lab,
                "assignment": data.assignment,
                "theory": data.theory,
                "status": data.status
              }
              // Performance.removePerformance(data.prn, data.module);
              Performance.updatePerformance(data.prn, mark, function (error, success) {
                if (error) console.log("Marks upload problem = " + error);
              });
            }
            req.flash('message', 'Marks are uploaded successfully');
            res.redirect('/admin/result');
          }
        });
      } catch (e) {
        console.log("Student Mark error = " + e);
        req.flash('error', 'Marks are not added !!!');
        res.redirect('/admin/result');
      }
    }
  });
});

router.get('/updatestudentmarks', isLoggedIn, function (req, res) {
  var mark = req.query;
  var course = req.query.course;
  var modules = req.query.module;
  Performance.updateMark(mark, function (err, result) {
    if (!result) { req.flash('updateErr', 'Something is wrong...Marks are not updated!!'); }
    else { req.flash('updateMsg', 'Marks updated successfully..!!'); }
    Performance.getMarksByModule(course, modules, function (err, result) {
      if (err) req.flash('resulterror', 'Marks id not found!!!');
      else req.session.result = result;
      req.flash('selectedModule', modules);
      res.redirect('/admin/result');
    });
  });
});

/**********************Company Feedback starts******************************************** */
/****************load the feedback page******************** */
router.get('/feedback', isLoggedIn, function (req, res) {
  var companies = [];
  var general = req.session.generalfeedback;
  var mod = req.session.modulefeedback;
  var select = req.session.selectedfeedback;
  var nostu = req.session.studentcount;
  var report = req.session.feedbackreport;
  var data = req.session.feedbackcontent;
  req.session.generalfeedback = '';
  req.session.modulefeedback = '';
  req.session.selectedfeedback = '';
  req.session.feedbackreport = '';
  req.session.feedbackcontent = '';
  Company.find({}).exec()
    .then(Cdetails => {
      companies = Cdetails.map(q => { return q.cname });
      res.render('admin/feedback', {
        companies,
        sfberr: req.flash('setfberr'),
        sfbmsg: req.flash('setfbmsg'),
        gfberr: req.flash('gfberr'),
        mfberr: req.flash('mfberr'),
        gfeedback: general,
        mfeedback: mod,
        set: select,
        report: report,
        data: data,
        students: nostu
      });
    })
    .catch(err => console.log("Error:", err));
});

/********************Data fetch according to the company name*************************************/
router.get('/comsend', isLoggedIn, function (req, res) {
  var abc = req.query.inp;
  Company.find({ cname: abc }).exec().then(
    details => {
      d = details;
      res.send(JSON.stringify(d));
    })
});
/**************************************END***************************************************/

/****************************Upload the result of student show in the performance tab************************************** */

router.get('/getPerformanceModule', isLoggedIn, function (req, res) {
  var course = req.query.course;
  var modules = [];
  Performance.getModule(course, function (err, result) {
    modules = result;
    res.send(JSON.stringify(modules));
  });
});

router.post('/getPerformanceByModule', isLoggedIn, function (req, res) {
  var course = req.body.course;
  var modules = req.body.module;
  Performance.getMarksByModule(course, modules, function (err, result) {
    if (err) req.flash('resulterror', 'Marks id not found!!!');
    else req.session.result = result;
    req.flash('selectedModule', modules);
    res.redirect('/admin/result');
  });
});

router.post('/removePerformanceByModule', isLoggedIn, function (req, res) {
  var course = req.body.course;
  var modules = req.body.module;
  Performance.removeModulePerformance(course, modules, (err, result) => {
    if (err) req.flash('updateErr',modules+" marks has not been removed successfully!!!");
    else
      req.flash('updateMsg', modules+" marks has been removed successfully");
    res.redirect('/admin/result');
  })
});

/******************************************End***************************** */
router.get('/result', isLoggedIn, function (req, res) {
  const marks = req.session.result;
  req.session.result = '';
  res.render('admin/result', {
    message: req.flash('message'),
    error: req.flash('error'),
    studenterror: req.flash('resulterror'),
    result: marks,
    updateerror: req.flash('updateErr'),
    updatemessage: req.flash('updateMsg'),
    modules: req.flash('selectedModule')
  });
});

router.post('/generalnotice', isLoggedIn, function (req, res) {
  var title = req.body.generalNoticeTitle;
  var content = req.body.generalNoticeBody;
  var date = new Date();
  var current = moment(date);
  var currDate = current.format("DD/MM/YYYY");
  let data = { title: title, date: currDate, description: content }
  Notice.insertGeneralNotice(data, function (err, result) {
    if (err) { req.flash('genNoticeErr', 'Data is not inserted'); res.redirect('/admin/notice'); }
    else { req.flash('genNoticeMsg', 'Notice is inserted'); res.redirect('/admin/notice'); }
  });
});

router.get('/deleteGeneralNotice', isLoggedIn, function (req, res) {
  var noticeid = req.query.noticeid;
  Notice.deleteGeneralNotice(noticeid, function (err, result) {
    if (err) req.flash('genNoticeErr', 'Something is wrong..Delete problem!!');
    else if (result) req.flash('genNoticeMsg', 'Notice deleted successfully..!!!');
    res.redirect('/admin/notice');
  });
});

/********** Notice uploading.. *****************/

const NoticeURL = './public/files/';
const NoticeStorage = multer.diskStorage({
  destination: NoticeURL,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const uploadNotice = multer({ storage: NoticeStorage, }).single('noticeFile');

router.post('/uploadNotice', isLoggedIn, function (req, res) {
  uploadNotice(req, res, (err) => {
    if (err) req.flash('err', err);
    else {
      var date = new Date();
      var current = moment(date);
      var currDate = current.format("DD/MM/YYYY");
      var data = {
        filename: req.file.originalname,
        date: currDate,
        courses: req.body.courses
      }
      Notice.insertNotice(data, function (err, result) {
        if (err) req.flash('err', "File not uploaded. Please try again..!!!");
        else req.flash('msg', 'File uploaded successfully');
        res.redirect('/admin/notice');
      });
    }
  });
});

router.get('/deleteNotice', isLoggedIn, function (req, res) {
  var filename = req.query.filename;
  var path = './public/files/' + filename;
  try {
    fs.unlink(path, function (err) {
      if (err) { req.flash('NoticeErr', 'Something is wrong..Delete problem!!'); res.redirect('/admin/notice'); }
    });
    Notice.deleteNotice(filename, function (err, result) {
      if (err) req.flash('NoticeErr', 'Something is wrong..Delete problem!!');
      else req.flash('NoticeMsg', 'Notice deleted successfully..!!!');
      res.redirect('/admin/notice');
    });
  } catch (e) {
    console.log("Something is wrong..Delete problem!!")
    res.redirect('/admin/notice');
  }
});

router.get('/notice', isLoggedIn, function (req, res) {
  Notice.getNotice(function (result) {
    res.render('admin/notice', {
      error: req.flash('genNoticeErr'),
      message: req.flash('genNoticeMsg'),
      noticeArray: result,
      uploadErr: req.flash('err'),
      uploadMsg: req.flash('msg')
    });
  });
});

router.get('/changepassword', isLoggedIn, function (req, res) {
  res.render('admin/changepass');
});

router.post('/changepassword', isLoggedIn, function (req, res) {
  var user = req.session.admin.username;
  var currentpass = req.body.currentpass;
  var pass = req.body.newpass;
  Admin.isAuthenticate(user, currentpass, function (err, result) {
    if (err) {
      res.send(JSON.stringify({ message: '', error: "Current password not matching" }));
    }
    else if (result) {
      Admin.updatePassword(user, pass, function (err, result) {
        if (result) res.send(JSON.stringify({ message: "Password is changed successfully", error: '' }));
        else res.send(JSON.stringify({ message: '', error: "Something is wrong. Try again..!!" }));
      });
    }
  });
});
router.post('/login', function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  Admin.isAuthenticate(user, pass, function (err, result) {
    if (err) {
      req.flash('error', err);
      res.redirect('/admin');
    } else {
      req.session.admin = result;
      res.redirect('/admin/home');
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
  req.session.generalfeedback = '';
  req.session.modulefeedback = '';
  req.session.selectedfeedback = '';
  req.session.studentcount = 0;
  req.session.feedbackreport = '';
  req.session.feedbackcontent = '';
  res.render('admin/index', { error: req.flash('error'), connerr: err });
});

router.get('/login', function (req, res) {
  res.render('admin/index', { error: req.flash('error') });
});

router.get('/viewprofile', isLoggedIn, function (req, res) {
  var studentid = req.query.studentid;
  var name = req.query.name;
  var course = req.query.course;
  var pro;
  var performance = [];

  Performance.getPerformance(studentid, function (err, result) {
    if (err) console.error("Data not found");
    else performance = result;


    const directoryPath = './public/images/profiles/profilepicture-' + studentid + '.png';
    fs.open(directoryPath, 'r+', function (err, result) {
      if (result) pro = studentid;
      res.render('admin/viewprofile', {
        student: { name: name, user: studentid, course: course },
        profile: pro,
        performance: performance
      });
    });
  });
});

router.get('/getAllStud', function (req, res) {
  Student.getAllStudents(function (err, result) {
    res.send(JSON.stringify(result));
    res.end();
  });
})

router.get('/home', isLoggedIn, function (req, res) {
  var list = [];
  Student.getAllStudents(function (err, result) {
    list = result;
    res.render('admin/home', { message: req.flash('message'), error: req.flash('err'), studList: list });
  });
});


router.post('/getAttByMonth', isLoggedIn, function (req, res) {
  var month = req.body.month;
  var course = req.body.course;
  var list = [];
  Attendence.getAttByCourse(month, course, function (err, result) {
    list = result;
    if (list.length > 0)
      res.send(JSON.stringify({ status: true, list: list }));
    else
      res.send(JSON.stringify({ status: false }));
  });
});


router.get('/attendence', isLoggedIn, function (req, res) {
  var months = [];
  var attendence = req.session.AttendenceList;
  req.session.AttendenceList = '';
  Attendence.getAllAttendence(function (err, result) {
    result.forEach(ele => {
      if (ele.date != "1900-01-01") {
        var ds = ele.date.split('-');
        months.push(ds[1]);
      }
    });
    var month = [...new Set(months)];
    res.render('admin/attendence', { month: month, Attendence: attendence });
  });
});

router.post('/setfeedback', isLoggedIn, function (req, res) {
  var date = new Date();
  var current = moment(date);
  var currDate = current.format("DD/MM/YYYY");
  var course = req.body.course;
  var modules = req.body.module;
  var faculty = req.body.faculty;
  var flag = req.body.flag;
  Feedback.checkFaculty(course, modules, faculty, function (err, result) {
    var feedback = new Feedback({
      course: course,
      module: modules,
      faculty: faculty,
      date: currDate,
      flag: flag
    });
    if (result.length > 0) {
      if (result[0].flag == flag)
        req.flash('setfberr', 'Module already set');
      else {
        Feedback.setFeedback(course, modules, faculty, function (err, result) {
          if (err) req.flash('setfberr', 'Something is wrong. Try again..!!');
          else req.flash('setfbmsg', 'Module added successfully..!!');
        });
      }
      res.redirect('/admin/feedback');
    }
    else {
      feedback.save(err => {
        if (err) req.flash('setfberr', 'Not done. Try again..!!');
        else req.flash('setfbmsg', 'Module added successfully..!!');
        res.redirect('/admin/feedback');
      });
    }
  });
});

router.get('/getModule', isLoggedIn, function (req, res) {
  var course = req.query.course;
  Feedback.distinctModule(course, function (err, result) {
    res.send(JSON.stringify(result));
  });
});

router.get('/getFaculty', isLoggedIn, function (req, res) {
  var course = req.query.course;
  var modules = req.query.module;
  Feedback.getFaculty(course, modules, function (err, result) {
    res.send(JSON.stringify(result));
  });
});

router.get('/gfeedback', isLoggedIn, function (req, res) {
  Gfeedback.getFeedback(function (err, result) {
    res.render('admin/gfeedback', { feedback: result, err: req.flash('gfberr', 'General feedback not found') });
  });
});

router.post('/gfeedback', isLoggedIn, function (req, res) {
  var course = req.body.course;
  Gfeedback.getFeedbackByCourse(course, function (err, result) {
    // var list = result.reverse();
    res.render('admin/gfeedback', { feedback: list, err: req.flash('gfberr', 'General feedback not found') });
  });
});

router.get('/getCountStudent', function (req, res) {
  var course = "DAC"
  Student.getCount(course, function (err, result) {
    res.write("Error = " + err);
    res.write("Result = " + result);
    res.end();
  })
})

router.post('/viewfeedbacks', isLoggedIn, function (req, res) {
  var course = req.body.course;
  var mod = req.body.module;
  var faculty = req.body.faculty;
  var selectfeed = req.body.selectfeed;
  var feed = req.body.feedback;
  Student.getCount(course, function (err, result) {
    req.session.studentcount = result;
  })
  if (feed == "Remark") {
    Feedback.getFeedback(course, mod, faculty, selectfeed, function (err, result) {
      if (result) {
        req.session.modulefeedback = result;
        req.session.selectedfeedback = selectfeed;
      }
      else req.flash('mfberr', 'Module feedback not found');
      res.redirect('/admin/feedback');
    });
  }
  else {
    Feedback.getFeedbackSummary(course, mod, faculty, selectfeed, function (err, result) {
      if (result) {
        req.session.feedbackcontent = { course: course, module: mod, faculty: faculty }
        req.session.feedbackreport = result;
        req.session.selectedfeedback = selectfeed;
      }
      else req.flash('mfberr', 'Module feedback not found');
      res.redirect('/admin/feedback');
    });
  }
})

router.get('/canteen', isLoggedIn, function (req, res) {
  var dates;
  var list = [];
  try {
    Canteen.getDate(function (err, result) {
      var len = result.length;
      if (len > 0) { dates = result[len - 1].date; list = result[len - 1].list }
      res.render('admin/canteen', { date: dates, list: list });
    });
  } catch (e) {
    console.log("Please set date first");
    res.render('admin/canteen', { date: dates, list: list });
  }
});

router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/admin');
})

function isLoggedIn(req, res, next) {
  if (req.session.admin)
    return next();
  else res.redirect('/admin');
}

router.get('/newCanteen', function (req, res) {
  var val = req.query.date;
  var today = moment();
  var tomorrow = moment(today).add(1, 'days');
  if (val == "0")
    tomorrow = moment(today);
  var currDate = tomorrow.format("DD/MM/YYYY");
  const can = new Canteen({ date: currDate });
  can.save();
  res.redirect('/admin/canteen');
});

module.exports = router;
