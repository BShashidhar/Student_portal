var mongoose = require('mongoose');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('SurajBalwantShinde');

let StudentSchema = mongoose.Schema({
  _id: 
  {
    type: Number
  },
  rollno: 
  {
    type: Number
  },
  name: 
  {
    type: String
  },
  password: 
  {
    type: String
  },
  course: 
  {
    type: String
  },
  email: 
  {
    type: String
  },
  contact: 
  {
    type: Number
  },
  dob: 
  {
    type: String
  },
  education: 
  {
    type: String
  },
  current_address: 
  {
    type: String
  },
  parement_address: 
  {
    type: String
  },
  flag: 
  {
    type: Number
  }
});

StudentSchema.statics.getStudentinfo = function (id, callback) {
  Student.find({ _id: id }, function (err, result) {
    callback(err, result);
  })
}

StudentSchema.statics.getStudentIdByCourse = function (course, callback) {
  Student.find({ course: course }, { _id: 1 }, function (err, result) {
    callback(err, result);
  });
}


StudentSchema.statics.getAllStudents = function (callback) {
  Student.find({}, function (err, result) {
    callback(err, result);
  })
}

StudentSchema.statics.updateStudentDetails = function (stud, callback) {
  Student.findOneAndUpdate({ _id: stud.user }, {
    email: stud.email,
    contact: stud.contact,
    dob: stud.dob,
    education: stud.education,
    current_address: stud.current_address,
    parement_address: stud.parement_address
  }, function (err, result) {
    if (err) callback(err);
    else callback(null, result);
  });
}

StudentSchema.statics.isAuthenticate = function (username, password, callback) {
  Student.findById({ _id: username }).exec(function (err, user) {
    if (err || !user) callback(true)
    else {
      const pass = cryptr.decrypt(user.password);
      if (pass == password) callback(null, user);
      else callback(true);
    }
  });
}


StudentSchema.statics.updatePassword = function (username, password, callback) {
  const encryptedString = cryptr.encrypt(password);
  var pass = encryptedString;
  Student.findOneAndUpdate({ "_id": username }, { $set: { password: pass, flag: 1 } }, function (err, result) {
    if (err) callback(err);
    else callback(null, result);
  });
}

StudentSchema.pre('save', function () {
  var user = this;
  const encryptedString = cryptr.encrypt(user.password);
  user.password = encryptedString;
});

StudentSchema.statics.getCount = function (course, callback) {
  Student.countDocuments({ course: course }, function (err, result) {
    callback(err, result);
  });
}

// create the model for photographers and expose it to our app
var Student = mongoose.model('students', StudentSchema);
module.exports = Student;

