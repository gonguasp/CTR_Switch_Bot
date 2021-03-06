const mongoose = require('mongoose');
const PlayerSchema = require('@models/PlayerSchema.js').model('PlayerSchema').schema;

const rankSchema = new mongoose.Schema({
  player: { type: PlayerSchema, require: true, unique: true },
  ffa: { type: Number, require: false, default: 1200 },
  duos: { type: Number, require: false, default: 1200 },
  war3vs3: { type: Number, require: false, default: 1200 },
  war4vs4: { type: Number, require: false, default: 1200 },
  itemless: { type: Number, require: false, default: 1200 },
  captain: { type: Number, require: false, default: 1200 }  
});

const model = mongoose.model("RankSchema", rankSchema);

module.exports = model;