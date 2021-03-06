require("module-alias/register");

const config = require('@config');
const Discord = require("discord.js");
const PlayerSchema = require('@models/PlayerSchema.js');
const RankSchema = require('@models/RankSchema.js');


exports.createPlayerRank = async function(player) {
    console.log(player);
}
