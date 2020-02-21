var mongoose = require('mongoose');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('SurajBalwantShinde');
var CompanySchema = new mongoose.Schema({
    username: {
        type: String,
        //required: true
    },
    password: {
        type: String,
        //required: true
    }
});


CompanySchema.statics.isAuthenticate = function (username, password, callback) {
    Company.findOne({
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

CompanySchema.statics.updatePassword = function (username, password, callback) {

    Company.findOneAndUpdate({
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

CompanySchema.statics.getAll = function (callback) {

    Company.find({}, function (err, result) {
        callback(err, result);
    });
}

var Company = mongoose.model('Companys', CompanySchema);

module.exports = Company;