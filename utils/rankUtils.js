require("module-alias/register");

const config = require('@config');
const Discord = require("discord.js");
const PlayerSchema = require('@models/PlayerSchema.js');
const RankSchema = require('@models/RankSchema.js');
const MatchSchema = require('@models/MatchSchema.js');


exports.createPlayerRankIfNotExists = async function(player) {
    let rankSchema = RankSchema.where({ playerDiscordId: player.id });
    await rankSchema.findOne(async function (err, playerRankResponse) {
        if(err) { console.log(err); return; }
        if(!playerRankResponse) {
            rankSchema = await RankSchema.create({
                playerDiscordId: player.id
            });
    
            await rankSchema.save();
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
    rankInfo.id = playerRank.player.discordId;

    return rankInfo;
}

exports.calculateAverageRank = function(playersRank) {
    let totalRank = 0;
    playersRank.forEach( element => totalRank += element.rank);
    return Math.round(totalRank / playersRank.length);

}

exports.processIfRankedResults = async function(message) {
    const channel = message.guild.channels.cache.find(ch => ch.name == config.resultsRankedChannel);
    if(message.channel != channel || message.author.bot) { return; }
    let info = await isValidResult(message.content);
    if(info.valid && info.rankedInfo.scores == undefined) {
        let winnersLosers = getWinnersLosers(info.rankedInfo.players, message.content);
        await calculateAndSaveRanks(winnersLosers, info.rankedInfo);
        message.reply("valido");
    }
    else if(info.rankedInfo.scores != undefined) {
        message.reply("that match already has final scores");
    }
    else {
        message.reply("not a valid format!");
    }
}

/////////////////////////////////////// PRIVATE FUNCTIONS



async function calculateAndSaveRanks(winnersLosers, rankedInfo) {
    winnersLosers.forEach( await function (player) {
        let playerRank = getPlayerRank(player.discordId);
        let probabilityWins = 1 / (1 + Math.pow(10, ((rankedInfo.averageRank - playerRank[rankedInfo.lobbyModality]) / 400)));
        let rating = playerRank[rankedInfo.lobbyModality] + config.ELOrankConstK * (parseInt(player.wins ? 1 : 0) - parseFloat(probabilityWins).toFixed(2));
        let playerRanked = {
            playerName: player.info.playerName ? player.info.playerName : player.info.discordUserName,
            previusRank: playerRank[rankedInfo.lobbyModality],
            rankChange: Math.round(config.ELOrankConstK * (parseInt(player.wins ? 1 : 0) - parseFloat(probabilityWins).toFixed(2)) * 100) / 100,
            currentRank: rating
        };
        console.log(playerRanked);
        /*console.log(rating);
        console.log(config.ELOrankConstK * (parseInt(player.wins ? 1 : 0) - parseFloat(probabilityWins).toFixed(2)));*/
    });
}

function getPlayersShortedByPoints(players, scoreTable) {
    let rows = scoreTable.split("\n");
    let playersWithPoints = [];
    for(let i = 0; i < rows.length; i++) {
        if(!rows[i].includes("|")) { continue; }
        let player = {};
        player.info = players.filter(item => (item.playerName ? item.playerName : item.discordUserName) == rows[i].split(" ")[0])[0];
        player.points = rows[i].split("] ")[1].split("|").reduce((num1, num2) => parseInt(num1) + parseInt(num2));
        playersWithPoints.push(player);
    }

    playersWithPoints.sort((playerA, playerB) => { return playerB.points - playerA.points });
    return playersWithPoints;
}

function getWinnersLosers(players, scoreTable) {
    let winnersLosers = getPlayersShortedByPoints(players, scoreTable);
    for(let i = 0; i < winnersLosers.length; i++) {
        winnersLosers[i].wins = (winnersLosers.length / (i + 1)) >= 2;
    }

    return winnersLosers;    
}

async function isValidResult(content) {
    let rankedInfo = await getRankedInfo(content);
    let result = {};
    result.valid = true;
    result.rankedInfo = rankedInfo;
    if(rankedInfo) {
        for(const player of rankedInfo.players) {
            let playerName = player.playerName != undefined ? player.playerName : player.discordUserName;
            if(content.search(playerName) == -1) {
                result.valid = false;
                break;
            }
        }

        if(result.valid) {
            let numPipes = (config.lobbies[rankedInfo.lobbyModality].numRaces - 1) * rankedInfo.players.length;
            let countPipes = content.split("|").length - 1;
            result.valid = numPipes == countPipes;
        }
    }
    else { result.valid = false; }

    return result;
}

async function getRankedInfo(content) {
    let rankedInfo = undefined;

    if(content.search(/#\d+#/) != -1) {
        content = content.replace(content.substring(0, content.indexOf("#")), "").replace("#", "");
        let numRanked = content.substring(0, content.indexOf("#"));
        let match = MatchSchema.where({ matchNumber: numRanked });
        await match.findOne(async function (err, matchResponse) {
            if(err) { console.log(err); return; }
            if(matchResponse) {
                rankedInfo = matchResponse;
            }
        });
    }

    return rankedInfo;
}

async function getPlayerRank(id) {
    let playerRank = undefined;

    let rank = RankSchema.where({ playerDiscordId: id });
    await rank.findOne(async function (err, rankResponse) {
        if(err) { console.log(err); return; }
        if(rankResponse) {
            playerRank = rankResponse;
        }
    });
    

    return playerRank;
}