const employees = require('../models/employees')
const leave = require('../models/leave')
const mongoose = require('mongoose')


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
