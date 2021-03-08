require("module-alias/register");

const config = require('@config');
const Discord = require("discord.js");
const PlayerSchema = require('@models/PlayerSchema.js');
const RankSchema = require('@models/RankSchema.js');


exports.createPlayerRankIfNotExists = async function(player) {
    let rankSchema = RankSchema.where({ playerDiscordId: player.id });
    await rankSchema.findOne(async function (err, playerRankResponse) {
        if(err) { console.log(err); return; }
        if(!playerRankResponse) {
            rankSchema = await RankSchema.create({
                playerDiscordId: player.id
            });
    
            rankSchema.save();
        }
    });
}


exports.findPlayerRank = async function(player) {
    let playerRank = {};
    let playerRankSchema = RankSchema.where({ playerDiscordId: player.id });
    await playerRankSchema.findOne(async function (err, playerRankResponse) {
        if(err) { console.log(err); return; }
        if(playerRankResponse) {
            playerRank.rank = playerRankResponse;
        }
    });

    let playerSchema = PlayerSchema.where({ discordId: player.id });
    await playerSchema.findOne(async function (err, playerResponse) {
        if(err) { console.log(err); return; }
        if(playerResponse) {
            playerRank.player = playerResponse;
        }
    });

    return playerRank;    
}

exports.getRankInfo = function(lobby, playerRank) {
    let rankInfo = {};
    rankInfo.playerName = playerRank.player.playerName ? playerRank.player.playerName : playerRank.player.discordUserName;
    rankInfo.playerName = rankInfo.playerName.substring(config.maxCharacersPlayerName, 0).padEnd(config.maxCharacersPlayerName);  
    rankInfo.rank = playerRank.rank[config.lobbies[lobby].rankName];
    rankInfo.id = playerRank.discordId;

    return rankInfo;
}