require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const Discord = require("discord.js");
const PlayerSchema = require('@models/PlayerSchema.js');
const flags = require('@flags');


exports.createPlayerIfNotExist = async function (user) {
    let player = PlayerSchema.where({ discordId: user.id });
    player.findOne(async function (err, playerResponse) {
        if(err) { console.log(err); return; }
        if(!playerResponse) {
            player = await PlayerSchema.create({
            discordId: user.id,
            discordUserName: user.username
        });
    
        player.save();
        }
    });
}