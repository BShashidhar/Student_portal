var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');

var Administrator = require('../models/administrator');
var Notice = require('../models/notice');
var Canteen = require('../models/canteen');
var Admin = require('../models/admin');
var CompanyLogin = require('../models/CompanyLogin');
var Faculty = require('../models/faculty');
var Student = require('../models/student');

router.get("/addAdmin", function (req, res) {
    var user = req.query.username;
    var pass = req.query.password;
    var admin = new Admin({
        username: user,
        password: pass
    });
    admin.save(err => {
        if (err) req.flash('err', "Error!Admin not added");
        else req.flash('msg', "Admin added successfully!!");
        res.redirect('/administrator/home');
    });
});

router.get("/addFaculty", function (req, res) {
    var user = req.query.username;
    var pass = req.query.password;
    var faculty = new Faculty({
        username: user,
        password: pass
    });
    faculty.save(err => {
        if (err) req.flash('err', "Error!Faculty not added");
        else req.flash('msg', "Faculty added successfully!!");
        res.redirect('/administrator/home');
    });
});

router.get("/addCompany", function (req, res) {
    var user = req.query.username;
    var pass = req.query.password;
    var companyLogin = new CompanyLogin({
        username: user,
        password: pass
    });
    companyLogin.save(err => {
        if (err) req.flash('err', "Error!CompanyLogin not added");
        else req.flash('msg', "CompanyLogin added successfully!!");
        res.redirect('/administrator/home');
    });
});

router.get('/checkStudent', function (req, res) {
    var id = req.query.studentid;
    Student.getStudentinfo(id, function (err, result) {
        if (result.length) req.flash('studentid', result[0]._id);
        else req.flash('err', "Student id not found!!");
        res.redirect('/administrator/home');
    });
});

router.get('/updateStudent', function (req, res) {
    var id = req.query.studentid;
    var pass = req.query.password;
    Student.updatePassword(id, pass, function (err, result) {
        req.flash('msg', "Student password uploaded successfully..!!");
        res.redirect('/administrator/home');
    });
});

router.get('/updateAdmin', isLoggedIn, function (req, res) {
    var user = req.query.user;
    var pass = req.query.pass;
    Admin.updatePassword(user, pass, function (err, result) {
        if (result) req.flash('msg', 'Update Successfully');
        else req.flash('err', 'Update Fail');
        res.redirect('/administrator/home');
    });
});

router.get('/updateFaculty', isLoggedIn, function (req, res) {
    var user = req.query.user;
    var pass = req.query.pass;
    Faculty.updatePassword(user, pass, function (err, result) {
        if (result) req.flash('msg', 'Update Successfully');
        else req.flash('err', 'Update Fail');
        res.redirect('/administrator/home');
    });
});

router.get('/updateCompany', isLoggedIn, function (req, res) {
    var user = req.query.user;
    var pass = req.query.pass;
    CompanyLogin.updatePassword(user, pass, function (err, result) {
        if (result) req.flash('msg', 'Update Successfully');
        else req.flash('err', 'Update Fail');
        res.redirect('/administrator/home');
    });
});

router.get('/getUser', isLoggedIn, function (req, res) {
    Admin.getAll(function (err, result) {
        if (result) res.send(JSON.stringify({ status: true, list: result }));
        else res.send(JSON.stringify({ status: false }));
    });
});



router.get('/home', isLoggedIn, function (req, res) {
    var msg = req.flash('msg');
    var error = req.flash('err');
    var id = req.flash('studentid');    
    var adminList = [], facultyList = [] , companyloglist =[];
    Admin.getAll((adminErr, adminResult) => {
        if (adminResult) adminList = adminResult;

        Faculty.getAll((facultyErr, facultyResult) => {
            if (facultyResult) facultyList = facultyResult;

            CompanyLogin.getAll((comapnyLErr, companyLResult) => {
                if (companyLResult) companyloglist = companyLResult;

            res.render('admin/mainhome', { err: error, msg: msg, studentid: id, admin: adminList, faculty: facultyList, companyL : companyloglist});
        })
    });
});
});

// router.get('/home', isLoggedIn, function (req, res) {
//     var msg = req.flash('msg');
//     var error = req.flash('err');
//     var id = req.flash('studentid');
//     var list = [];
//     Admin.getAll(function (err,result) {
//         if(result) list= result;
//         res.render('admin/mainhome',{err:error, msg:msg, studentid:id, admin: list, faculty :[]});
//     });
// });

router.get('/changepassword', isLoggedIn, function (req, res) {
    res.render('admin/mainpass');
});

router.post('/changepassword', isLoggedIn, function (req, res) {
    var user = req.session.Administrator.username;
    var currentpass = req.body.currentpass;
    var pass = req.body.newpass;
    Administrator.isAuthenticate(user, currentpass, function (err, result) {
        if (err) {
            res.send(JSON.stringify({ message: '', error: "Current password not matching" }));
        }
        else if (result) {
            Administrator.updatePassword(user, pass, function (err, result) {
                if (result) res.send(JSON.stringify({ message: "Password is changed successfully", error: '' }));
                else res.send(JSON.stringify({ message: '', error: "Something is wrong. Try again..!!" }));
            });
        }
    });
});


router.get('/', function (req, res) {
    res.render('admin/main', { error: req.flash('error') });
});

router.post('/login', function (req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    Administrator.isAuthenticate(user, pass, function (err, result) {
        if (err) {
            req.flash('error', err);
            res.redirect('/administrator');
        } else {
            req.session.Administrator = result;
            res.redirect('/administrator/home');
        }
    })
});

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/administrator');
})

function isLoggedIn(req, res, next) {
    if (req.session.Administrator)
        return next();
    else res.redirect('/administrator');
}

mongoose.connect('mongodb://localhost/cdacstudentportal', { useNewUrlParser: true }, function (err) {
    if (err) console.log("Mongodb connetion problem");
});


router.get('/setDatabase', function (req, res) {
    var notice = new Notice({ _id: 88 })
    notice.save();
    var ad = new Administrator({ username: "superuser", password: "admin" });
    ad.save();
    var date = new Date();
    var current = moment(date);
    var currDate = current.format("DD/MM/YYYY");
    const can = new Canteen({ date: currDate });
    can.save();
    res.redirect('/administrator');
});

module.exports = router;
