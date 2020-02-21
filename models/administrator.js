var mongoose = require('mongoose');

var AdministratorSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});


AdministratorSchema.statics.isAuthenticate = function (username, password, callback) {
    Administrator.findOne({
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

AdministratorSchema.statics.updatePassword = function (username, password, callback) {
    Administrator.findOneAndUpdate({
        "username": username
    }, {
        $set: {
            password: password
        }
    }, function (err, result) {
        if (err) return callback(err);
        else return callback(null, result);
    });
}

var Administrator = mongoose.model('administrators', AdministratorSchema);

module.exports = Administrator;