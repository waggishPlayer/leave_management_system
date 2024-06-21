const models = require('../models/index_models')
const mongoose = require('mongoose')
const functions = require('../controllers/functions')


//Apply for leave application
module.exports.leave_application_post = async (req, res) => {
    try {
        const { employee_id, leave_type, leave_date, leave_end_date, reason_for_leave } = req.body;

        const holidays_list = await models.holidays.find({
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
        const number_of_days = functions.calculate_working_days(new Date(leave_date), new Date(leave_end_date), holidays_list);

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

//for GET request for leave application by admin and employees
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

        const leave_records = await models.leave.aggregate([
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

//for GET request for leave application by managers
module.exports.leave_history_manager_get = async(req, res) =>{
    try {
        let leave_records;
        leave_records = await models.leave.aggregate([
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

//Update leave Application by the admin
module.exports.leave_update = async (req, res, next) => {
    const employeeid = req.params.id;
    try {
        const updated_record = await models.leave.findOneAndUpdate(
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

