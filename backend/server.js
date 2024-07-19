const mongoose = require("mongoose");
const dotenv = require('dotenv');
const app = require('./index.js');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE_CONNECTION.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
}).then(con => {
    console.log(con.connections);
    console.log("DB connection successful");
})

const port = process.env.PORT || 8000;
app.listen(port, ()=>{
    console.log(`APP RUNNING ON PORT ${port}...`);
})

