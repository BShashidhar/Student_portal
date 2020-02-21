var mongoose = require('mongoose');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('SurajBalwantShinde');
var AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        //required: true
    },
    password: {
        type: String,
        //required: true
    }
});


AdminSchema.statics.isAuthenticate = function (username, password, callback) {
    Admin.findOne({
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

AdminSchema.statics.updatePassword = function (username, password, callback) {

    Admin.findOneAndUpdate({
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

AdminSchema.statics.getAll = function (callback) {

    Admin.find({}, function (err, result) {
        callback(err, result);
    });
}

var Admin = mongoose.model('admins', AdminSchema);

module.exports = Admin;