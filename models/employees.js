const { lowerCase } = require('lodash')
const mongoose = require('mongoose')
const { type } = require('os')
const bcrypt = require('bcrypt')
const employees_schema =new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, "Please Enter the First Name"]
    },
    middle_name: {
        type: String
    },
    last_name: {
        type: String,
        required: [true, "Please Enter the Last Name"]
    },
    address: {
        type: String,
        required: [true, "Please Enter the address"]
    },
    date_of_birth: {
        type: Date,
        required: [true, "Please Enter the Date of Birth"]
    },
    username: {
        type: String,
        unique: true,
        required: [true, "Please Enter the Username"]
    },
    phone_number: {
        type: String,
        length: 10,
        required: [true, "Please Enter the Phone Number"],
        unique:true
    },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees'
    },
    month_salary: {
        type: Number,
        required: [true, "Please Enter the Salary"]
    },
    role:{
        type: String,
        enum: ['Employee', 'Manager','Admin'],
        default: 'Employee'
    },
    email: {
        type: String,
        required: [true, "Please Enter the email"],
        unique: true,
        lowerCase:true
    },
    password: {
        type: String,
        required: [true, "Please enter the Password"]
    }
})

//Hashing password
employees_schema.pre('save',async function(next){
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

const employees = mongoose.model("employees_info", employees_schema)
module.exports = employees