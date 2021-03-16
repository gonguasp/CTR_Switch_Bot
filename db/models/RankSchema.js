const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  discordId: { type: String, require: true, unique: true },
  playerName: { type: String, require: true },
  ffa: { type: Number, require: false, default: 1200 },
  ffaPlayed: { type: Number, require: false, default: 0 },
  ffaWon: { type: Number, require: false, default: 0 },
  duos: { type: Number, require: false, default: 1200 },
  duosPlayed: { type: Number, require: false, default: 0 },
  duosWon: { type: Number, require: false, default: 0 },
  war3vs3: { type: Number, require: false, default: 1200 },
  war3vs3Played: { type: Number, require: false, default: 0 },
  war3vs3Won: { type: Number, require: false, default: 0 },
  war4vs4: { type: Number, require: false, default: 1200 },
  war4vs4Played: { type: Number, require: false, default: 0 },
  war4vs4Won: { type: Number, require: false, default: 0 },
  itemless: { type: Number, require: false, default: 1200 },
  itemlessPlayed: { type: Number, require: false, default: 0 },
  itemlessWon: { type: Number, require: false, default: 0 },
  captain: { type: Number, require: false, default: 1200 },
  captainPlayed: { type: Number, require: false, default: 0 },
  captainWon: { type: Number, require: false, default: 0 }
});

const model = mongoose.model("RankSchema", rankSchema);

module.exports = model;