var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

var CanteenSchema = new mongoose.Schema({
    date: {
        type: String,
        unique: true
    },
    list: [{
        studentid: {
            type: Number
        },
        registorNumber: {
            type: Number
        }
    }]
});

CanteenSchema.statics.check = function (user, callback) {
    Canteen.find({list: {$elemMatch: {studentid: user}}}).exec(function (err, result) {
        callback(result);
    });
}

CanteenSchema.statics.getDate = function (callback) {
    Canteen.find({}).sort({$natural:-1}).limit(1).exec(function (err, result) {
        callback(err, result);
    });
}

CanteenSchema.statics.registor = function (studentid, date, callback) {
    Canteen.findOne({
        date: date
    }, function (err, result) {
        if (result) {
            var no = result.list.length;
            if (no < 1) no = 1;
            else no++;
            Canteen.updateOne({
                date: date
            }, {
                $push: {
                    list: {
                        studentid: studentid,
                        registorNumber: no
                    }
                }
            }, function (err, result) {
                if (err) callback(true);
                callback(false, no);
            });
        }
    });
}

Canteen = mongoose.model('canteens', CanteenSchema);
module.exports = Canteen;
