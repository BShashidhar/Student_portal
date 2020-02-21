var mongoose = require('mongoose');

const ResultSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    studentid :{
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
    course:
    {
        type: String
    },
    module:
    {
        type: String
    },
    answer: [
        {
            type: String
        }]
});
module.exports = mongoose.model('Result', ResultSchema);