const mongoose = require('mongoose');
const PlayerSchema = require('@models/PlayerSchema.js').model('PlayerSchema').schema;

const matchSchema = new mongoose.Schema({
  uuid: { type: String, require: true, unique: true },
  matchNumber: { type: Number, require: true, unique: true },
  lobbyModality: { type: String, require: true },
  numPlayers: { type: Number, require: true },
  players: { type: [PlayerSchema], require: true },
  scores: { type: String, require: false },
  created: { type: Date, default: Date.now }  
});

const model = mongoose.model("MatchSchema", matchSchema);

module.exports = model;