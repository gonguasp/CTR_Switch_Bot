const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  playerDiscordId: { type: String, require: true, unique: true },
  ffa: { type: Number, require: false, default: 1200 },
  ffaPlayed: { type: Number, require: false, default: 0 },
  duos: { type: Number, require: false, default: 1200 },
  duosPlayed: { type: Number, require: false, default: 0 },
  war3vs3: { type: Number, require: false, default: 1200 },
  war3vs3Played: { type: Number, require: false, default: 0 },
  war4vs4: { type: Number, require: false, default: 1200 },
  war4vs4Played: { type: Number, require: false, default: 0 },
  itemless: { type: Number, require: false, default: 1200 },
  itemlessPlayed: { type: Number, require: false, default: 0 },
  captain: { type: Number, require: false, default: 1200 },
  captainPlayed: { type: Number, require: false, default: 0 }
});

const model = mongoose.model("RankSchema", rankSchema);

module.exports = model;