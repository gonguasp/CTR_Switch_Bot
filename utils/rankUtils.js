require("module-alias/register");

const config = require('@config');
const PlayerSchema = require('@models/PlayerSchema.js');
const RankSchema = require('@models/RankSchema.js');
const MatchSchema = require('@models/MatchSchema.js');
const ParametersSchema = require('@models/ParametersSchema.js');
const utils = require('@utils/utils.js');
const Discord = require("discord.js");


exports.findPlayerRank = async function(user) {
    let playerRank = {};
    playerRank.rank = await RankSchema.findOne({ discordId: user.id }).exec();
    playerRank.player = await PlayerSchema.findOne({ discordId: user.id }).exec();

    return playerRank;    
}

exports.createOrEditPlayerRank = async function(user, playerName) {
    let filter = { discordId: user.id };
    let update = {
        discordId: user.id,
        playerName: ((playerName != undefined || playerName != null) ? playerName : user.discordUserName)
    };
    let rankPlayer = await RankSchema.findOne(filter).exec();

    if(rankPlayer == null) {
        rankPlayer = await RankSchema.create({
            discordId: update.discordId,
            playerName: update.playerName
        });
    }
    else {
        let options = {
            new: true,
            upsert: true  
        };
        rankPlayer = await RankSchema.findOneAndUpdate(filter, update, options).exec();
    }

    return rankPlayer;
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
        try {
            let modality = config.lobbies[info.rankedInfo.lobbyModality].rankName;
            let contentPlayers = await getPlayersFromContent(message.content);
            if(allPlayersExist(message, contentPlayers)) {
                let rankedResults;
                if(!config.lobbies[info.rankedInfo.lobbyModality].team) {    
                    let winnersLosers = getWinnersLosers(contentPlayers, message.content);
                    rankedResults = await calculateRanks(winnersLosers, info.rankedInfo);    
                    let sanctions = await getSanctionedPlayers(contentPlayers, info.rankedInfo.players, modality);
                    rankedResults = rankedResults.concat(sanctions);
                    message.channel.send("\nMatch #" + info.rankedInfo.matchNumber + "\n\n```" + pretyPrint(rankedResults) + "```");
                }
                else {
                    let teamsSplited = getTeams(message.content);
                    let winnersLosers = getWinnersLosersTeams(teamsSplited);
                    let winnersLosersIndividuals = getTeamsWinnersLosers(winnersLosers, modality);

                    for(let i = 0; i < contentPlayers.length; i++) {
                        winnersLosersIndividuals[i].info = {};
                        winnersLosersIndividuals[i].info.discordId = contentPlayers.filter(contentPlayer => {
                            return contentPlayer.playerName == winnersLosersIndividuals[i].player;
                        })[0].discordId;
                        winnersLosersIndividuals[i].info.playerName = winnersLosersIndividuals[i].player;
                    }

                    rankedResults = await calculateRanks(winnersLosersIndividuals, info.rankedInfo);    
                    let sanctions = await getSanctionedPlayers(contentPlayers, info.rankedInfo.players, modality);
                    rankedResults = rankedResults.concat(sanctions);
                    message.channel.send("\nMatch #" + info.rankedInfo.matchNumber + "\n\n```" + pretyPrint(rankedResults) + "```");
                }

                await saveRankedResults(rankedResults, modality, message.content, info.rankedInfo.matchNumber);
                await editEmbedGlobalResults(message);
            }
        } catch (err) { console.log(err); }
    }
    else if(info.valid && (info != undefined || info.rankedInfo != undefined || info.rankedInfo.scores != undefined)) {
        message.reply("that match already has final scores").then(msg => {
            msg.delete({ timeout: 5000 })
        }).catch(console.error);
    }
    else {
        message.reply("not a valid format!").then(msg => {
            msg.delete({ timeout: 5000 })
        }).catch(console.error);
    }
    message.delete();
}

exports.updateGlobalResults = async function (message) {
    try {
        editEmbedGlobalResults(message);
        message.channel.send("Global ranked results updated!");
    } catch(err) {
        console.log(err);
    }
}

exports.restartSeasson = async function(message, modality) {
    switch (modality) {
        case "duos":
            let filter = {};
            filter[modality + "Played"] = { $ne: 0 };
            let update = {};
            update[modality] = 1200;
            update[modality + "Played"] = 0;
            update[modality + "Won"] = 0;
            RankSchema.updateMany(filter, update, {}).exec();
            break;
        default:
            message.reply("not valid modality!");
            break;
    }
}

/////////////////////////////////////// PRIVATE FUNCTIONS



function getWinnersLosersTeams(teams) {
    let winnersLosers = {};
    for(let i = 1; i <= teams.length; i++) {
        let totalPoints = sumPoints(teams[i - 1]);
        for(let j = 1; j <= teams[i - 1].length; j++) {
            winnersLosers[i * 5 + j] = {
                player: getMembers(teams[i - 1]).split(",")[j - 1],
                points: totalPoints
            };
        }
    }

    return winnersLosers;
}

function getMembers(team) {
    let members = [];

    for(let member of team) {
        members.push(member.split(" [")[0]);
    }

    return members.join(",");
}

function sumPoints(team) {
    let points = 0;
    for(let member of team) {
        let pointsString = member.split("] ")[1];
        pointsString = pointsString.split("|");
        points += pointsString.reduce((a, b) => (parseInt(a) + parseInt(b)), 0);
    }

    return points;
}


function getTeams(scoresTemplate) {
    let teams = scoresTemplate.split("\n\n");
    teams.shift();
    let teamsSplited = [];

    for(let team of teams) {
        team = team.split("\n");
        team.shift();
        teamsSplited.push(team);
    }

    return teamsSplited;
}

async function editEmbedGlobalResults(message) {
    let messageDescription = "Message id of global rank";
    let messageSchema = await ParametersSchema.findOne({ description: messageDescription }).exec();
    let channel = utils.getChannelByName(message, config.globalRankChannel);
    let embed = await getGlobalRankEmbed();

    if(messageSchema == null || messageSchema == undefined) {
        let msg = await channel.send(embed);
        await ParametersSchema.create({
            name: msg.id,
            description: messageDescription
        });
    }
    else {
        channel.messages.fetch({ around: messageSchema.name, limit: 1 }).then(msg => {
            try {
                msg.first().edit(embed);
            } catch(err) {
                console.log(err);
            }
        });
    }
}

async function getGlobalRankEmbed() {
    const embed = new Discord.MessageEmbed();
    let lobbiesNames = Object.getOwnPropertyNames(config.lobbies);

    for(let lobbyModality of lobbiesNames) {
        let rankModality = config.lobbies[lobbyModality].rankName;
        let fields = {};
        fields["playerName"] = 1;
        
        let players;
        if(rankModality == "ffa") {
            players = await RankSchema.find({ ffaPlayed: { $ne: 0 } }, fields );
        }
        else if(rankModality == "duos") {
            players = await RankSchema.find({ duosPlayed: { $ne: 0 } }, fields );
        }
        else if(rankModality == "war3vs3") {
            players = await RankSchema.find({ war3vs3Played: { $ne: 0 } }, fields );
        }
        else if(rankModality == "war4vs4") {
            players = await RankSchema.find({ war4vs4Played: { $ne: 0 } }, fields );
        }
        else if(rankModality == "itemless") {
            players = await RankSchema.find({ itemlessPlayed: { $ne: 0 } }, fields );
        }
        
        let info = players.length + " players fighting for the #1";
        let url = (await ParametersSchema.findOne({ description: "server-global-rank" }).exec()).name;
        embed.addField("Global " + rankModality + " rank", "\n[" + info + "](" + url + "/"+ rankModality + ")", true);
    }

    return embed;
}

function allPlayersExist(message, contentPlayers) {
    let allPlayersExist = true;
    for(let player of contentPlayers) {
        if(typeof player === "string") {
            message.reply(player + "\nThat player should use !set_player_name <name> and resend the scores table").then(msg => {
                msg.delete({ timeout: 10000 })
            }).catch(console.error);
            allPlayersExist = false;
        }
    }
    return allPlayersExist;
}

async function saveRankedResults(results, modality, scoresTable, matchNumber) {
    let options = {
        new: true,
        upsert: true  
    };
    let filter;
    
    for(let result of results) {
        let current = await getPlayerRank(result.discordId);
        let update = {};
        update[modality] = parseInt(result.currentRank);
        update[modality + "Played"] = parseInt(current[modality + "Played"]) + parseInt(1);
        update[modality + "Won"] = parseInt(current[modality + "Won"]) + parseInt(parseInt(result.rankChange) > 0 ? 1 : 0);
        filter = { discordId: result.discordId };
        await RankSchema.findOneAndUpdate(filter, update, options).exec();
    }

    filter = { matchNumber: matchNumber };
    update = {};
    update.scores = scoresTable;
    await MatchSchema.findOneAndUpdate(filter, update, options).exec();
    
}

async function getSanctionedPlayers(contentPlayers, lobbyPlayers, modality) {
    let ids = contentPlayers.map(a => a.discordId);
    let playersToSaction = lobbyPlayers.filter(player => !ids.includes(player.discordId));
    let sanctionedPlayers = [];

    for(let player of playersToSaction) {
        let playerRank = await getPlayerRank(player.discordId);
        let currentRating = parseInt(playerRank[modality]) + parseInt(config.rankedSanction);
        let playerRanked = {
            discordId: player.discordId,
            playerName: (player.playerName ? player.playerName : player.discordUserName),
            previusRank: playerRank[modality],
            rankChange: config.rankedSanction,
            currentRank: currentRating,
            status: "sanctioned"
        };

        sanctionedPlayers.push(playerRanked);
    }

    return sanctionedPlayers;
}

async function getPlayersFromContent(content) {
    let rows = content.split("\n");
    let players = [];
    for(let i = 0; i < rows.length; i++) {
        if(!rows[i].includes("|")) { continue; }
        let name = rows[i].split(" [")[0].trimEnd();
        let player = await PlayerSchema.findOne({ playerName: name }).exec();
        if(player == null) {
            player = "ERROR! Player " + name + " not found.";
        }
        players.push(player);
    }

    return players;
}

function pretyPrint(rankedResults) {
    let rankedResultsPrety = "";
    rankedResults.forEach((rank) => {
        rankedResultsPrety += rank.playerName.padEnd(config.maxCharacersPlayerName) + " " + (rank.status != undefined ? rank.status : "") + ": " + rank.previusRank + "  | " + (rank.rankChange > 0 ? " " + rank.rankChange : rank.rankChange) + "  =>  " + rank.currentRank + "\n";
    });

    return rankedResultsPrety;
}

async function calculateRanks(winnersLosers, rankedInfo) {
    let extraPoints = {
        "4": [+3, +1, -1, -3],
        "5": [+3, +1, 0, -1, -3],
        "6": [+7, +3, +1, -1, -3, -7],
        "7": [+7, +3, +1, 0, -1, -3, -7],
        "8": [+10, +7, +3, +1, -1, -3, -7, -10],
    };
    extraPoints = extraPoints[winnersLosers.length];
    let rankedResults = [];
    let modality = config.lobbies[rankedInfo.lobbyModality].rankName;
    let averageRank = await calculateAverageRank(winnersLosers, modality);

    for(let i = 0; i < winnersLosers.length; i++) {
        let playerRank = await getPlayerRank(winnersLosers[i].info.discordId);
        let probabilityWins = 1 / (1 + Math.pow(10, ((averageRank - playerRank[modality]) / 400)));
        let eloRating = parseInt(config.ELOrankConstK * (parseInt(winnersLosers[i].wins ? 1 : 0) - parseFloat(probabilityWins).toFixed(2)));
        eloRating = winnersLosers[i].tie ? "  0" : eloRating;
        let rating = playerRank[modality] + eloRating + parseInt((config.lobbies[rankedInfo.lobbyModality].team ? 0 : extraPoints[i]));
        let playerRanked = {
            discordId: winnersLosers[i].info.discordId,
            playerName: winnersLosers[i].info.playerName ? winnersLosers[i].info.playerName : winnersLosers[i].info.discordUserName,
            previusRank: playerRank[modality],
            rankChange: config.lobbies[rankedInfo.lobbyModality].team ? eloRating : winnersLosers[i].tie ? "  0 +0" : (extraPoints[i] > 0 ? " " : "") + eloRating + ((winnersLosers.length == 8 && i != 0 && i != 7) ? " " : "") + (extraPoints[i] > 0 ? " +" : " ") + extraPoints[i],
            currentRank: winnersLosers[i].tie ? playerRank[modality] : parseInt(rating)
        };

        rankedResults.push(playerRanked);
    }

    return rankedResults;
}

async function calculateAverageRank(players, modality) {
    let averageRank = 0;
    for(let player of players) {
        averageRank += (await getPlayerRank(player.info.discordId))[modality];
    }

    return averageRank / players.length;
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
    let impares = players.length % 2 != 0;
    let flagNoWinNoLose = impares;
    let winnersLosers = getPlayersShortedByPoints(players, scoreTable);
    for(let i = 0; i < winnersLosers.length; i++) {
        winnersLosers[i].wins = (winnersLosers.length / (i + 1)) >= 2;
        if(winnersLosers[i].wins == false && impares && flagNoWinNoLose) {
            flagNoWinNoLose = false;
            winnersLosers[i].tie = true;
        }
    }

    return winnersLosers;    
}

function getTeamsWinnersLosers(winnersLosers, modality) {
    let flagTie = true;
    let counter = 0;
    winnersLosers = Object.values(winnersLosers).sort((a,b) => (a.points < b.points) ? 1 : ((b.points < a.points) ? -1 : 0));
    for(let i = 0; i < winnersLosers.length; i++) {
        winnersLosers[i].wins = (winnersLosers.length / (i + 1)) >= 2;
        if(modality == "duos" && winnersLosers.length == 6 && flagTie) {
            if(counter > 1) {
                winnersLosers[i].tie = true;
            }
            if(counter == 3) {
                flagTie = false;
            }
        }
        counter++;
    }

    return winnersLosers;    
}

async function isValidResult(content) {
    let rankedInfo = await getRankedInfo(content);
    let result = {};
    result.valid = true;
    result.rankedInfo = rankedInfo;
    if(rankedInfo) {
        if(result.valid) {
            let countPipes = content.split("|").length - 1;
            result.valid = countPipes % (config.lobbies[rankedInfo.lobbyModality].numRaces - 1) == 0
                && countPipes >= ((config.lobbies[rankedInfo.lobbyModality].numRaces - 1) * parseInt(config.lobbies[rankedInfo.lobbyModality].minsPlayers));
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
    return await RankSchema.findOne({ discordId: id }).exec();
}