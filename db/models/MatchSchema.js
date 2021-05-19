const mongoose = require('mongoose');
const PlayerSchema = require('@models/PlayerSchema.js').model('PlayerSchema').schema;

const matchSchema = new mongoose.Schema({
  uuid: { type: String, require: true, unique: true },
  matchNumber: { type: Number, require: true, unique: true },
  lobbyModality: { type: String, require: true },
  players: { type: [PlayerSchema], require: true },
  averageRank: { type: Number, require: true },
  teams: { type: [[PlayerSchema]], require: false },
  author: { type: String, require: false },
  writenMessages: { type: [String], require: false },
  closed: { type: Boolean, require: false },
  scores: { type: String, require: false },
  created: { type: Date, default: Date.now }  
});

const model = mongoose.model("MatchSchema", matchSchema);

module.exports = model;