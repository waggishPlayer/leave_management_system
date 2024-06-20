const mongoose = require('mongoose')
const holiday_schema = new mongoose.Schema({
    name:{
        type: String
    },
    type:{
        type: String,
        enum:['National Holiday', 'Office Holiday'],
        required:true
    },
    date:{
        type: Date,
        required:true
    }
})

const holidays = new mongoose.model('holidays_table', holiday_schema)
module.exports = holidays