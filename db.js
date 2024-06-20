const mongoose = require('mongoose')
const mongoURL = 'mongodb+srv://aliaccessideas:123@cluster1.ptzi1ct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1'
mongoose.connect(mongoURL, {useUnifiedTopology: true, useNewUrlParser: true})
const db = mongoose.connection

//event listeners
db.on('connected', () => {
    console.log('Connected to MongoDB')
})
db.on('error', (err) =>{
    console.log(`${err}: Unable to connected to mongodb`)
})
db.on('disconnected', () =>{
    console.log('Disconnected from MongoDB')
})
module.exports = db