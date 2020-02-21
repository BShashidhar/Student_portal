var mongoose = require('mongoose');

var FeedbackSchema = new mongoose.Schema({
    course: {
        type: String
    },
    module: {
        type: String
    },
    faculty: {
        type: String
    },
    date: {
        type: String
    },
    midfeedback: [],
    feedback: [],
    flag: {
        type: Number
    }
});

FeedbackSchema.statics.setFeedback = function (course, modules, faculty, callback) {
    Feedback.update({
        course: course,
        module: modules,
        faculty: faculty
    }, {
        $set: {
            flag: 1
        }
    }, function (err, result) {
        callback(err, result);
    });
}


FeedbackSchema.statics.insertFeedback = function (course, modules, faculty, data, callback) {
    Feedback.update({
        course: course,
        module: modules,
        faculty: faculty
    }, {
        $push: {
            feedback: [data]
        }
    }, function (err, result) {
        callback(err, result);
    });
}

FeedbackSchema.statics.getFeedback = function (course, modules, faculty, selectfeed, callback) {

    if (selectfeed == 1) {
        Feedback.find({
            course: course,
            module: modules,
            faculty: faculty
        }, {
            midfeedback: 0
        }, function (err, result) {
            callback(err, result);
        });
    } else {
        Feedback.find({
            course: course,
            module: modules,
            faculty: faculty
        }, {
            feedback: 0
        }, function (err, result) {
            callback(err, result);
        });
    }
}

FeedbackSchema.statics.getFeedbackSummary = function (course, modules, faculty, selectfeed, callback) {
    if (selectfeed == 1) {
        Feedback.aggregate([{
                $match: {
                    course: course,
                    module: modules,
                    faculty: faculty
                }
            },
            {
                $group: {
                    _id: null,
                    entry: {
                        $push: {
                            proficiency: "$feedback.proficiency",
                            communiction: "$feedback.communiction",
                            interaction: "$feedback.interaction",
                            quality: "$feedback.quality",
                            confidence: "$feedback.confidence",
                            labproficiency: "$feedback.labproficiency",
                            assistance: "$feedback.assistance",
                            assignment: "$feedback.assignment",
                        }
                    }
                }
            }
        ], function (err, result) {
            callback(err, result);
        });
    } else {
        Feedback.aggregate([{
                $match: {
                    course: course,
                    module: modules,
                    faculty: faculty
                }
            },
            {
                $group: {
                    _id: null,
                    entry: {
                        $push: {
                            preparedness: "$midfeedback.preparedness",
                            speed: "$midfeedback.speed",
                            understanding: "$midfeedback.understanding",
                            response: "$midfeedback.response",
                        }
                    }
                }
            }
        ], function (err, result) {
            callback(err, result);
        });
    }
}

FeedbackSchema.statics.getFeed = function (course, modules, callback) {
    Feedback.find({
        course: course,
        module: modules
    }, function (err, result) {
        callback(err, result);
    });
}


FeedbackSchema.statics.insertMidFeedback = function (course, modules, faculty, data, callback) {
    Feedback.update({
        course: course,
        module: modules,
        faculty: faculty
    }, {
        $push: {
            midfeedback: [data]
        }
    }, function (err, result) {
        callback(err, result);
    });
}

FeedbackSchema.statics.checkFaculty = function (course, modules, faculty, callback) {
    Feedback.find({
        course: course,
        module: modules,
        faculty: faculty
    }, {
        feedback: 0,
        midfeedback: 0
    }, function (err, result) {
        callback(err, result);
    });
}

FeedbackSchema.statics.getFaculty = function (course, modules, callback) {
    Feedback.find({
        course: course,
        module: modules
    }, {
        feedback: 0,
        midfeedback: 0
    }, function (err, result) {
        callback(err, result);
    });
}

FeedbackSchema.statics.distinctModule = function (course, callback) {
    Feedback.distinct("module", {
        course: course
    }, function (err, result) {
        callback(err, result);
    });
}

FeedbackSchema.statics.getModule = function (course, callback) {
    Feedback.find({
        course: course
    }, {
        feedback: 0,
        midfeedback: 0
    }, function (err, result) {
        callback(err, result);
    });
}
Feedback = mongoose.model('feedbacks', FeedbackSchema);
module.exports = Feedback;