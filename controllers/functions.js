const employees = require('../models/employees')
const leave = require('../models/leave')
const holidays = require('../models/holidays')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
require('dotenv').config();


//function for total days excluding holidays
const calculate_working_days = (start_date, end_date, holidays) => {
    let total_days = 0;
    let current_date = new Date(start_date);

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

const functions = {calculate_working_days, send_email}
module.exports.functions