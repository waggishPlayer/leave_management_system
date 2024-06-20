const mongoose = require('mongoose')
const { type } = require('os')
const leave_schema = mongoose.Schema({
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Employees_Info',
        required: true
    },
    leave_type: {
        type: String,
        required: true
    },
    leave_date: {
        type: Date,
        required: true
    },
    leave_end_date: {
        type: Date,
        required: true
    },
    number_of_days: {
        type: Number
    },
    leave_status: {
        type: String,
        enum: ['Approved', 'Rejected', 'Pending', 'Cancel'],
        default: 'Pending',
        required:true

    },
    reason_for_leave: {
        type: String
    }
})

const leave = new mongoose.model("leave_applications", leave_schema)
module.exports = leave