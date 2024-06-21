const express = require('express')
const router = express.Router()
const auth_controller = require('../controllers/auth_controller')
const salary_controller = require('../controllers/salary_controller')
const leave_controller = require('../controllers/leave_controller')
const auth_middleware = require('../middlewares/auth_middleware')

//Routers
router.post('/upload', auth_controller.upload, (req, res) =>{res.send('file upoaded successfully')})
router.post('/user/register', auth_middleware.require_auth, auth_middleware.restrict(['Admin']), auth_controller.register)
router.post('/user/login', auth_controller.login_post)
router.post('/leave/apply', auth_middleware.require_auth, leave_controller.leave_application_post)
router.get('/leave/view', auth_middleware.require_auth, leave_controller.leave_history_get)
router.get('/leave/manager/:id', auth_middleware.require_auth, auth_middleware.restrict(['Manager']), auth_middleware.correct_manager, leave_controller.leave_history_manager_get)
router.put('/leave/manager/:id', auth_middleware.require_auth, auth_middleware.restrict(['Manager']), auth_middleware.correct_manager, leave_controller.leave_update)
router.put('/leave/update/:id', auth_middleware.require_auth, auth_middleware.restrict(['Admin']), leave_controller.leave_update)
router.get('/salary/view', auth_middleware.require_auth, salary_controller.final_salary)


module.exports = router