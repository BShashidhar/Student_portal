var mongoose = require('mongoose');

var NoticeSchema = new mongoose.Schema({
    _id: {
        type: Number
    },
    notice: [{
        filename: {
            type: String
        },
        date: {
            type: String
        },
        courses: {
            type: String
        },
    }],
    general: [{
        title: {
            type: String
        },
        date: {
            type: String
        },
        description: {
            type: String
        }
    }]
});

NoticeSchema.statics.getNoticeByCourse = function (course, callback) {
    Notice.find({}, function (err, result) {
        callback(err, result);
    });
}

NoticeSchema.statics.insertNotice = function (data, callback) {
    Notice.findOne({
        _id: 88
    }, function (err, result) {
        if (result) {
            Notice.updateOne({
                _id: 88
            }, {
                $addToSet: {
                    notice: [{
                        filename: data.filename,
                        date: data.date,
                        courses: data.courses
                    }]
                }
            }, function (err, result) {
                if (err) callback(true);
                else callback(null, result);
            });
        } else callback(true);
    });
}

NoticeSchema.statics.deleteNotice = function (filename, callback) {
    Notice.updateOne({
        _id: 88
    }, {
        $pull: {
            notice: {
                filename: filename
            }
        }
    }, function (err, result) {
        console.log(err);
        if (err) callback(true);
        else callback(false, result);
    });
}




NoticeSchema.statics.insertGeneralNotice = function (data, callback) {
    Notice.findOne({
        _id: 88
    }, function (err, result) {
        if (result) {
            Notice.updateOne({
                _id: 88
            }, {
                $addToSet: {
                    general: [{
                        title: data.title,
                        date: data.date,
                        description: data.description
                    }]
                }
            }, function (err, result) {
                if (err) callback(true);
                else callback(null, result);
            });
        } else callback(true);
    });
}
NoticeSchema.statics.deleteGeneralNotice = function (id, callback) {
    Notice.updateOne({
        _id: 88
    }, {
        $pull: {
            general: {
                _id: {
                    $in: [id]
                }
            }
        }
    }, function (err, result) {
        if (err) callback(err);
        else callback(false, result);
    })
}
NoticeSchema.statics.getNotice = function (callback) {
    Notice.findOne({
        _id: 88
    }, function (err, result) {
        callback(result);
    });
}
Notice = mongoose.model('notices', NoticeSchema);
module.exports = Notice;