var mongoose = require('mongoose');

let QuestionSchema = mongoose.Schema({
    _id: {
        type: Number,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    answer: {
        type: String,
        required: true
    }
});
let ModulePaperSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    timeSlot: {
        type: String,
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
    moduleName: {
        type: String,
        required: true
    },
    questions: [QuestionSchema],
});


module.exports = mongoose.model('ModulePaper', ModulePaperSchema);

