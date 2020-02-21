var mongoose = require('mongoose');

const TempResultSchema = mongoose.Schema({
    _id: {
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
module.exports = mongoose.model('TempResult', TempResultSchema);