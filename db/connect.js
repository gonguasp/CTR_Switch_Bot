const config = require('@config');
const mongoose = require("mongoose");

exports.connectDB = function() {
    
    mongoose.connect(config.mongoDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        userFindAndModify: false,
        useFindAndModify: false
    }).then(() => {
        console.log("CONNECTED TO DATABASE");
    }).catch((err) => {
        console.log(err);
    });
}




