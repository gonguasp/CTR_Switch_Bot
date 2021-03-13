require("module-alias/register");

const config = require('@config');
const Discord = require("discord.js");
const PlayerSchema = require('@models/PlayerSchema.js');
const RankSchema = require('@models/RankSchema.js');
const MatchSchema = require('@models/MatchSchema.js');


exports.findPlayerRank = async function(user) {
    let playerRank = {};
    playerRank.rank = await createPlayerRankIfNotExists(user);
    playerRank.player = await PlayerSchema.findOne({ discordId: user.id }).exec();

    return playerRank;    
}

exports.createPlayerRankIfNotExists = async function(user) {
    await createPlayerRankIfNotExists(user)
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
        message.reply("valido");
        //players signed to the lobby info.rankedInfo.players
        let winnersLosers = getWinnersLosers(await getPlayersFromContent(message.content), message.content);
        let rankedResults = await calculateRanks(winnersLosers, info.rankedInfo);    
        message.reply("\n" + pretyPrint(rankedResults));
    }
    else if(info.valid && (info != undefined || info.rankedInfo != undefined || info.rankedInfo.scores != undefined)) {
        message.reply("that match already has final scores");
    }
    else {
        message.reply("not a valid format!");
    }
}

/////////////////////////////////////// PRIVATE FUNCTIONS



async function createPlayerRankIfNotExists(user) {
    let created = await RankSchema.findOne({ playerDiscordId: user.id }).exec();
    if(created == null) {
        created = await RankSchema.create({
            playerDiscordId: user.id,
            discordUserName: user.username
        });
    }

    return created;
}

async function getPlayersFromContent(content) {
    let rows = content.split("\n");
    let players = [];
    for(let i = 0; i < rows.length; i++) {
        if(!rows[i].includes("|")) { continue; }
        let name = rows[i].split(" [")[0].trimEnd();
        let player = await PlayerSchema.findOne({ playerName: name }).exec();
        if(player == null)
            player = await PlayerSchema.findOne({ discordUserName: name }).exec();
        players.push(player);
    }

    return players;
}

function pretyPrint(rankedResults) {
    let rankedResultsPrety = "";
    rankedResults.forEach((rank) => {
        rankedResultsPrety += rank.playerName + ":\n" + rank.previusRank + "  |  " + rank.rankChange + "  =>  " + rank.currentRank + "\n\n";
    });

    return rankedResultsPrety;
}

async function calculateRanks(winnersLosers, rankedInfo) {
    let rankedResults = [];

    for(let player of winnersLosers) {
        
        let playerRank = await getPlayerRank(player.info.discordId);
        let probabilityWins = 1 / (1 + Math.pow(10, ((rankedInfo.averageRank - playerRank[rankedInfo.lobbyModality.toLowerCase()]) / 400)));
        let rating = playerRank[rankedInfo.lobbyModality.toLowerCase()] + config.ELOrankConstK * (parseInt(player.wins ? 1 : 0) - parseFloat(probabilityWins).toFixed(2));
        let playerRanked = {
            playerName: player.info.playerName ? player.info.playerName : player.info.discordUserName,
            previusRank: playerRank[rankedInfo.lobbyModality.toLowerCase()],
            rankChange: Math.round(config.ELOrankConstK * (parseInt(player.wins ? 1 : 0) - parseFloat(probabilityWins).toFixed(2)) * 100) / 100,
            currentRank: rating
        };

        rankedResults.push(playerRanked);
    }

    return rankedResults;
}

function getPlayersShortedByPoints(players, scoreTable) {
    let rows = scoreTable.split("\n");
    let playersWithPoints = [];
    for(let i = 0; i < rows.length; i++) {
        if(!rows[i].includes("|")) { continue; }
        let player = {};  
        player.info = players.filter(item => (item.playerName ? item.playerName : item.discordUserName) == rows[i].split(" [")[0].trimEnd())[0];
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
        /*for(const player of rankedInfo.players) {
            let playerName = player.playerName != undefined ? player.playerName : player.discordUserName;
            if(content.search(playerName) == -1) {
                result.valid = false;
                break;
            }
        }*/

        if(result.valid) {
            let countPipes = content.split("|").length - 1;
            result.valid = countPipes % (config.lobbies[rankedInfo.lobbyModality].numRaces - 1) == 0;
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
        rankedInfo = await MatchSchema.findOne({ matchNumber: numRanked }).exec();
    }

    return rankedInfo;
}

async function getPlayerRank(id) {
    return await RankSchema.findOne({ playerDiscordId: id }).exec();
}