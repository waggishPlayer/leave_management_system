const mongoose = require('mongoose')
const employees = require('../models/employees')
const leave = require('../models/leave')
const jwt = require('jsonwebtoken')
const functions = require('../controllers/functions')
const multer = require('multer')

//Register a user
module.exports.register = async (req, res) => {
    const {first_name, middle_name, last_name, address, date_of_birth, username, phone_number, manager_id, role, month_salary, email, password} = req.body
    try{
        const employee = await employees.create({first_name, middle_name, last_name, address, date_of_birth, username, phone_number, manager_id, role, month_salary, email, password})

        const subject = 'Employee Details';
        const message = `
            Hello, ${first_name} ${last_name},

            Welcome to the company!

            Here are your Company details:
            
            Name: ${first_name} ${middle_name} ${last_name}
            Date Of Birth: ${date_of_birth}
            Address: ${address}
            Username: ${username}
            Contact Number: ${phone_number}
            Manager ID: ${manager_id}
            Role: ${role}
            Monthly Salary: ${month_salary} Rupees
            Company email: ${email}
            Password: ${password}



            Thank you,
        `;

        const emailSent = await functions.send_email(email, subject, message);

        if (emailSent) {
            res.status(200).json({ employee: employee._id });
        } else {
            res.status(500).json("User Signup successful, but failed to send email.");
        }

    }catch(err){
        console.log(err)
        res.status(400).json("User Signup not successful")
    }
}

//User login
module.exports.login_post = async (req, res) => {
    const {email, password} = req.body
    try{
        const employee = await employees.findOne({email})
        const token = auth_middleware.create_token(employee);
        if (token) {
            return res.status(200).json({user: employee._id, token});
        } else {
            return res.status(500).json({ error: 'Failed to create token, please login again' });
        }
    }catch(err){
        console.log(err)
        res.status(500).json("Internal server error")
    }
}

//Upload
module.exports.upload = multer({
    storage:multer.diskStorage({
        destination:function(req, file, cb){
            cb(null, 'Uploads')
        },
        filename:function(req, file, cb){
            cb(null, file.fieldname + '-' + Date.now() + '.jpg')
        }
    })
}).single('file')

