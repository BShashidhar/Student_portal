var mongoose = require('mongoose');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('SurajBalwantShinde');
var FacultySchema = new mongoose.Schema({
    username: {
        type: String,
        //required: true
    },
    password: {
        type: String,
        //required: true
    }
});


FacultySchema.statics.isAuthenticate = function (username, password, callback) {
    Faculty.findOne({
        "username": username
    }).exec(function (err, user) {
        if (err) {
            return callback("system problem");
        } else if (!user) {
            return callback('Username not found.');
        } else if (user.password == password) {
            return callback(null, user);
        } else {
            return callback('Password not Match.');
        }
    });
}

FacultySchema.statics.updatePassword = function (username, password, callback) {

    Faculty.findOneAndUpdate({
        "username": username
    }, {
        $set:{
            password: password
        }
    }, function (err, result) {
        if (err) return callback(err);
        else return callback(null, result);
    });
}

FacultySchema.statics.getAll = function (callback) {

    Faculty.find({}, function (err, result) {
        callback(err, result);
    });
}

var Faculty = mongoose.model('faculty', FacultySchema);

module.exports = Faculty;