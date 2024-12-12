const mongoose = require("mongoose");
const { watchTTLDeletion } = require('../models/watchTTLDeletion');
require("dotenv").config();

const dbConnect = async () => {
    try{
        const connect = await mongoose.connect(process.env.DB_CONNECT);
        console.log("DB connected");
        // Change Stream 감시 시작
        watchTTLDeletion();
    } catch(err){  
        console.log(err);
    }
};


module.exports = dbConnect;