var mongoose = require('mongoose');

var GeneralSchema = new mongoose.Schema({

    course: {
        type: String
    },
    studentid: {
        type: String
    },
    date: {
        type: String
    },
    feedback: {
        type: String
    }
});

GeneralSchema.statics.getFeedback = function (callback) {
    Gfeedback.find({}).sort({$natural:-1}).exec(function (err, result) {
        callback(err, result);
    });
}

GeneralSchema.statics.getFeedbackByCourse = function (course, callback) {
    Gfeedback.find({
        course: course
    }).sort({$natural:-1}).exec(function (err, result) {
        callback(err, result);
    });
}

Gfeedback = mongoose.model('generalfeedbacks', GeneralSchema);
module.exports = Gfeedback;