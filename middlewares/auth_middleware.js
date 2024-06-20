const jwt = require('jsonwebtoken')
const employees = require('../models/employees')
const { default: mongoose } = require('mongoose')

//create token
const create_token = (user) => {
    try {
        const token = jwt.sign({id:user._id,role:user.role}, 'secret', { expiresIn: '3d' });
        return token;
    } catch (err) {
        console.error('Error creating token:', err);
        return null;
    }
}

//Checks if user is logged in or not
const require_auth = (req, res, next) => {
    let token = req.headers.authorization;
    if (token) {
        token = token.split(' ')[1]
        jwt.verify(token, 'secret', async (err, decodedToken) => {
            if (err) {
                res.status(401).send('Please login with valid credentials or contact your admin');
            } else {
                req.user = decodedToken;
                next();
            }
        });
    } else {
        res.status(401).send("Incorrect token");
    }
};

//Restrict for a particular role
const restrict = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).send('You do not have permission for this action');
        }
        next();
    };
};


const correct_manager = async (req, res, next) => {
    try {
        const employee_id = new mongoose.Types.ObjectId(req.params.id);
        const manager_id = new mongoose.Types.ObjectId(req.user._id);
        const manager_employee = await employees.findOne({
            _id:employee_id,
            manager_id : req.user.id
        }).exec()

        if (manager_employee) {
            return next();
        } else {
            console.log('Manager is not authorized');
            return res.status(403).send('You are not authorized for this user');
        }
    } catch (err) {
        console.error('Error verifying manager:', err);
        res.status(500).send('Internal server error');
    }
};

const auth_middleware = {create_token, require_auth, restrict, correct_manager}
module.exports = auth_middleware