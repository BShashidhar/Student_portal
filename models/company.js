var mongoose = require('mongoose');
var CompanySchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    cname:{
        type: String
    },
    aperson:{
        type: String
    },
    course:{
        type:String
    },
    compfeedback: [    
    ],
});
 

module.exports = mongoose.model('company', CompanySchema)