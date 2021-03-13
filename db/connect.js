const config = require('@config');
const mongoose = require("mongoose");

exports.connectDB = function(client) {
    
    mongoose.connect(config.mongoDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        userFindAndModify: false
    }).then(() => {
        console.log("conxion con la base de datos exitosa");
    }).catch((err) => {
        console.log(err);
    });
}




