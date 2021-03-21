const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  discordPartnersIds: { type: Array, require: true },
  lobbyMatch: { type: Number, require: false },
  modality: { type: String, require: true },
  activeUntil: { type: Date, default: Date.now }
});

const model = mongoose.model("TeamSchema", teamSchema);

module.exports = model;