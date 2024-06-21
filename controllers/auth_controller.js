const { default: mongoose } = require('mongoose')
const models = require('../models/index_models')
const {employees, holidays, leave} = models
const jwt = require('jsonwebtoken')
const { result } = require('lodash')
const nodemailer = require('nodemailer')
const auth_controller = require('../middlewares/auth_middleware')
const auth_middleware = require('../middlewares/auth_middleware')
const multer = require('multer')
require('dotenv').config();



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

        const emailSent = await send_email(email, subject, message);

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

//function for total days excluding holidays
const calculate_working_days = (start_date, end_date, holidays) => {
    let total_days = 0;
    let current_date = new Date(start_ate);

    while (current_date <= end_date) {
        const day_of_week = current_date.getDay();
        if (day_of_week !== 0 && day_of_week !== 6) { // 0 is Sunday, 6 is Saturday
            // Check if the current day is a holiday
            const is_holiday = holidays.some(holiday => holiday.date.getTime() === current_date.getTime());
            if (!is_holiday) {
                total_days++;
            }
        }
        current_date.setDate(current_date.getDate() + 1);
    }

    return total_days;
};

module.exports.leave_application_post = async (req, res) => {
    try {
        const { employee_id, leave_type, leave_date, leave_end_date, reason_for_leave } = req.body;

        const holidays_list = await holidays.find({
            date: {
                $gte: new Date(leave_date),
                $lte: new Date(leave_end_date)
            }
        });

          // Normalize holidays array to have only date parts for comparison
        const holiday_dates = holidays_list.map(holiday => new Date(holiday.date));

        // Function to check if a date is a weekend or holiday
        const is_weekend_or_holiday = (date) => {
            const day_of_week = new Date(date).getDay();
            const is_weekend = (day_of_week === 0 || day_of_week === 6); // 0 is Sunday, 6 is Saturday
            const is_holiday = holiday_dates.some(holiday => holiday.getTime() === new Date(date).getTime());
            return is_weekend || is_holiday;
        }

        // Check if the start or end date is a weekend or holiday
        if (is_weekend_or_holiday(leave_date)) {
            return res.status(400).send('Leave cannot start on a weekend or holiday.');
        }

        if (is_weekend_or_holiday(leave_end_date)) {
            return res.status(400).send('Leave cannot end on a weekend or holiday.');
        }

        // Calculate the number of working days excluding holidays
        const number_of_days = calculate_working_days(new Date(leave_date), new Date(leave_end_date), holidays_list);

        const new_leave = new leave({
            employee_id,
            leave_type,
            leave_date,
            leave_end_date,
            number_of_days,
            reason_for_leave
        });

        await new_leave.save()
        res.status(201).json(new_leave);
    } catch (err) {
        console.error('Error creating leave:', err);
        res.status(500).send('Internal server error');
    }

}


module.exports.leave_history_get = async (req, res) => {
    try {
        let { page = 1, limit = 10, ...search_params } = req.query;
        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        if (req.user.role !== 'Admin') {
            search_params.employee_id = req.user._id;
        }

        if (search_params.employee_id) {
            search_params.employee_id = new mongoose.Types.ObjectId(search_params.employee_id);
        }

        const leave_records = await leave.aggregate([
            { $match: search_params },
            {
                $lookup: {
                    from: 'employees_infos',
                    localField: 'employee_id',
                    foreignField: '_id',
                    as: 'employee_details'
                }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    'employee_details': 0
                }
            }
        ]);

        res.status(200).json({ leave_records });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports.leave_history_manager_get = async(req, res) =>{
    try {
        let leave_records;
        leave_records = await leave.aggregate([
            { 
                $match: { employee_id:new mongoose.Types.ObjectId(req.params.id) } 
            },
            {
                $lookup: {
                from: 'employees_infos',
                localField: 'employee_id',
                foreignField: '_id',
                as: 'employee_details'
                }
            }
        ]);

        res.status(200).json({ leave_records });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports.leave_update = async (req, res, next) => {
    const employeeid = req.params.id;
    try {
        const updated_record = await leave.findOneAndUpdate(
            { employee_id: employeeid },
            {
                $set: {
                    leave_end_date: req.body.leave_end_date,
                    number_of_days: req.body.number_of_days,
                    leave_status: req.body.leave_status
                }
            },
            { new: true }
        )

        if (!updated_record) {
            return res.status(404).json({ message: "Leave record not found" });
        }

        res.status(200).json({ message: "Updated record successfully", updated_record });
    }catch (err){
        res.status().json("Could not update the record")
    }
}

//Deducted Salary
module.exports.final_salary = async (req, res, next) => {
    try {
        let filter = {};

        if (req.user.role === 'Admin') {
            let { page = 1, limit = 10, ...search_params } = req.query;
            page = Number(page);
            limit = Number(limit);
            const skip = (page - 1) * limit;

            // If searchParams contains employeeID, convert it to ObjectId
            if (search_params.employee_id) {
                search_params.employee_id = new mongoose.Types.ObjectId(search_params.employee_id);
            }

            // Construct filter object with searchParams
            filter = { ...search_params };

            // Fetch all employees based on filter criteria
            const all_employees = await employees.find(filter).skip(skip).limit(limit);
            const all_salary_data = [];

            for (let emp of all_employees) {
                const { _id: emp_id, first_name, last_name, month_salary } = emp;

                // Fetch approved leaves for each employee
                const approved_leaves = await leave.find({ employee_id: emp_id, leave_status: 'Approved' });
                const total_leave_days = approved_leaves.reduce((sum, leave) => sum + leave.number_of_days, 0);
                const deducted_salary = Math.round((month_salary / 31) * total_leave_days);
                const final_salary = month_salary - deducted_salary;

                all_salary_data.push({
                    employee_id: emp_id,
                    employee_name: `${first_name} ${last_name}`,
                    total_leave_days,
                    month_salary,
                    deducted_salary,
                    final_salary,
                });
            }

            res.json(all_salary_data);
        } else if (req.user.role === 'Employee') {
            // Employee can view their own salary
            const emp_id = req.user.userId; // Assuming userId is set in the token
            const emp = await employees.findById(emp_id);

            if (!emp) {
                return res.status(404).send('Employee not found');
            }

            const { first_name, last_name, month_salary } = emp;
            const approved_leaves = await leave.find({ employee_id: emp_id, leave_status: 'Approved' });
            const total_leave_days = approved_leaves.reduce((sum, leave) => sum + leave.number_of_days, 0);
            const deducted_salary = Math.round((month_salary / 31) * total_leave_days);
            const final_salary = month_salary - deducted_salary;

            res.json({
                employee_id: emp_id,
                employeeName: `${first_name} ${last_name}`,
                total_leave_days,
                month_salary,
                deducted_salary,
                final_salary,
            });
        } else {
            res.status(403).send('Unauthorized access');
        }
    } catch (err) {
        console.error('Error fetching salaries:', err);
        res.status(500).send('Internal server error');
    }
}

// Function to send email
const send_email = async (email, subject, message) => {
    try {
        const user = process.env.EMAIL
        const pass = process.env.PASSWORD

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass
            }
        });

        let info = await transporter.sendMail({
            from: user,
            to: email,
            subject: subject,
            text: message
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (err) {
        console.error('Error sending email:', err);
        return false;
    }
};

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
