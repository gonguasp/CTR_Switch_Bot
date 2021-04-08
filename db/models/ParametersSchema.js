const mongoose = require('mongoose');

const parametersSchema = new mongoose.Schema({
  name: { type: String, require: true, unique: true },
  description: { type: String, require: false } 
});

const model = mongoose.model("ParametersSchema", parametersSchema);

module.exports = model;