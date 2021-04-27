const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  discordId: { type: String, require: true, unique: true },
  discordUserName: { type: String, require: true },
  playerName: { type: String, require: false, unique: true },
  friendCode: { type: String, require: false },
  clan: { type: String, require: false },
  flag: { type: String, require: false, default: "🇻🇦" },
  region: { type: String, require: false },
  languages: { type: [String], require: false },
  birthday: { type: String, require: false },
  discordVC: { type: Boolean, require: false, default: false },
  nat: { type: String, require: false },
  timeZone: { type: String, require: false },
  favCharacter: { type: String, require: false },
  favTrack: { type: String, require: false },
  updated: { type: Date, default: Date.now },
  created: { type: Date, default: Date.now },
  bannedUntil: { type: Date, require: false },
  bannedReason: { type: String, require: false }
});

const model = mongoose.model("PlayerSchema", playerSchema);

module.exports = model;