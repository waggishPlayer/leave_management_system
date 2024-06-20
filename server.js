const express = require('express')
// var bodyParser = require('body-parser')
const app = express()
const db = require('../leave_management/db')
const authroutes = require('../leave_management/routes/authroutes')
const port = 5000

//middlewares
app.use(express.json())
app.use(authroutes)

//event listener
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})
