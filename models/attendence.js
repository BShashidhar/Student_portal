var mongoose = require('mongoose');

var AttendenceSchema = new mongoose.Schema({
   datestudentid: { type: String },
   course: { type : String},
   date: { type: String },
   studentid: { type: String},   
   employeeid: { type: String },
   itime: { type: String },
   otime: { type: String },
   duration: { type: String },
   lateby: { type: String },
   earlyby: { type: String },
   status: { type: String },
   punchrecords: {type: String }
});

AttendenceSchema.statics.getAttendence = function (studentid, callback) {
   Attendence.find({
      studentid: studentid
   }, function (err, result) {
      callback(err, result);
   })
}

AttendenceSchema.statics.getAttByMonth = function (studentid, month, callback) {
   Attendence.find({
      studentid: studentid,
      date: {
         '$regex': month
      }
   }, function (err, result) {
      callback(err, result);
   });
}

AttendenceSchema.statics.getAttByCourse = function (month,course, callback) {
   Attendence.find({ date: {'$regex': month }, course:course}, function (err, result) {
      callback(err, result);
   });
}

AttendenceSchema.statics.getAllAttendence = function (callback) {
   Attendence.find({},{date:1},function (err, result) {
      callback(err, result);
   });
}

AttendenceSchema.statics.clean = function () {
    mongoose.connection.dropCollection('attendences');
}

Attendence = mongoose.model('attendences', AttendenceSchema);
module.exports = Attendence;