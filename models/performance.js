var mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

let PerformanceSchema = mongoose.Schema({
    _id: {
        type: Number
    },
    course: {
        type: String
    },
    marks: [{
        module: {
            type: String
        },
        lab: {
            type: Number
        },
        assignment: {
            type: Number
        },
        theory: {
            type: Number
        },
        status: {
            type: String
        }
    }]
});



PerformanceSchema.statics.getCoursePerformance = function (course, callback) {
    Performance.find({
        course: course
    }, function (err, result) {
        callback(err, result);
    });
}
PerformanceSchema.statics.getMarksByModule = function (course, modules, callback) {
    Performance.find({
        course: course,
        "marks.module": modules
    }).sort({
        _id: 1
    }).exec(function (err, result) {
        callback(err, result);
    });
}

PerformanceSchema.statics.getModule = function (course, callback) {
    Performance.distinct("marks.module", {
        course: course
    }, function (err, result) {
        callback(err, result);
    });
}

PerformanceSchema.statics.removePerformance = function (studentid, modules) {
    Performance.update({
        "_id": Number(studentid)
    }, {
            $pull: {
                "marks": { module: modules }
            }
        });
}

PerformanceSchema.statics.removeModulePerformance = function (course, modules, callback) {
    Performance.updateMany({
        "course": course
    }, {
            $pull: {
                "marks": { module: modules }
            }
        }, function (err, result) {
            return callback(err, result);
        });
}

PerformanceSchema.statics.updatePerformance = function (studentid, marks, callback) {
    Performance.findOneAndUpdate({
        "_id": Number(studentid)
    }, {
            $push: {
                "marks": [marks]
            }
        }, function (err, result) {
            return callback(err, result);
        });
}

PerformanceSchema.statics.updateMark = function (mark, callback) {
    Performance.updateOne({
        "_id": Number(mark.studentid),
        marks: {
            $elemMatch: {
                module: mark.module
            }
        }
    }, {
            $set: {
                "marks.$.assignment": mark.assignment,
                "marks.$.lab": mark.lab,
                "marks.$.theory": mark.theory,
                "marks.$.status": mark.status
            }
        }, {
            new: true
        }, function (err, result) {
            return callback(err, result);
        });
}

PerformanceSchema.statics.getPerformance = function (studentid, callback) {
    Performance.findById(Number(studentid), function (err, result) {
        if (err) return callback(true);
        else if (!result) {
            return callback(true);
        }
        return callback(null, result);
    })
}
Performance = mongoose.model('performances', PerformanceSchema);
module.exports = Performance;