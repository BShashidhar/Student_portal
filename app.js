const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const session = require('express-session');
const expressLayout = require('express-ejs-layouts');
const app = express();
const cors = require('cors');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayout);
app.use(session({ secret: 'surajbalwantshinde', resave: false, saveUninitialized: true}));
app.use(expressValidator());
app.use(cors());
app.use(flash());
// app.use(function(req, res){res.setHeader('Content-Type', 'text/plain');});

const studentRouter = require('./routes/student');
const facultyRouter = require('./routes/faculty');
const adminRouter = require('./routes/admin');
const company = require('./routes/company');
const administratorRouter = require('./routes/administrator');

app.use('/student', studentRouter);
app.use('/admin', adminRouter);
app.use('/faculty', facultyRouter);
app.use('/administrator', administratorRouter);
app.use('/company',company);
app.use('/', studentRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  console.log(err);
  
  res.status(err.status || 500);
  res.render('error');
});

app.use(function(err, req, res, next) {
  console.log(err);
  
  return res.status(500).send({ error: err });
});

module.exports = app;
