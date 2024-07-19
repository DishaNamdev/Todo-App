const mongoose = require('mongoose');
const app = require("./index");
const dotenv = require('dotenv');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE_CONNECTION.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(con => {
    // console.log(con.connections);
    console.log("DB connection successful");
})

const port = process.env.PORT || 8000; 


app.listen(port, ()=>{
    console.log(`app is listening on http://localhost:${port}/`);
})

