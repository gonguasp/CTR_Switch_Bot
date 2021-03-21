require("module-alias/register");

let createLobby;
const config = require('@config');
const utils = require('@utils/utils.js');
const Discord = require("discord.js");
var cron = require('node-cron');
const PlayerSchema = require('@models/PlayerSchema.js');
const MatchSchema = require('@models/MatchSchema.js');
const flags = require('@flags');


exports.scheduleLobbyNotification = function(lobby, futureTask, usersString, time, message, notifications) {
    
    if(futureTask != undefined) {
        futureTask.first.destroy();
        futureTask.second.destroy();
    }
    
    let channel = utils.getChannelByName(message, config.lobbies[lobby].channel);
    futureTask = {};
    futureTask.first = createCron(usersString, time, channel, notifications[0]);
    futureTask.second = createCron(usersString, time, channel, notifications[1]);

    return futureTask;
}

exports.parseTime = function(time) {
    
    let localTimeZone = time.split("\n").find(element => element.includes(config.localTimeZone.value));
    return to24HH(localTimeZone);
}

exports.getLobbyDuration = function(time) {
    let timeParsed = this.parseTime(time);
    let futureTime = new Date();

    if(futureTime.getHours() > timeParsed.hours) {
        futureTime.setHours(parseInt(24) + parseInt(timeParsed.hours));
    }
    else {
        futureTime.setHours(timeParsed.hours);
    }

    if(timeParsed.minutes != undefined) {
        futureTime.setMinutes(timeParsed.minutes);
    }
    return futureTime.getTime() - new Date().getTime();
}

exports.setLobbyTimeZone = async function (message, Discord, lobby, modeuleCreateLobby){

    createLobby = modeuleCreateLobby;
    const channel = message.channel;
    const title = "Set a timezone.";
    const color = "#FFFFFF";
    let time = "";
    Object.values(config.timeZones).forEach(timeZone => {
        time += timeZone.emoji + "  " + timeZone.UTCZone + " " + timeZone.name + "\n";
    });
    time = time.replace("NewYork", "New York");

    const embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(title)
                    .addField("Time", time, true);

    let messageEmbed = await channel.send(embed);
                
    Object.values(config.timeZones).forEach(async (timeZone) => {
        await messageEmbed.react(timeZone.emoji);
    });

    messageEmbed.awaitReactions((reaction, user) => user.id == message.author.id, { 
        max: 1, time: 30000 }).then(collected => {
            let emoji = collected.first().emoji.name;
            if (isCorrectEmoji(emoji)) {
                message.channel.send("Selected " + emoji + " timezone!");
                setLobbyLocalTime(message, emoji, Discord, lobby);
            }
            else
                message.reply("terminated: Invalid Response");
    }).catch(() => {
        message.reply("Operation canceled: Timeout");
    });     
}

exports.genTracks = function (numRaces) {
    var includeBannedTracks = false;
    var numBlueRaces = 0;
    var numSacredRaces = 0;
    var min = 1; 
    var max = 39;  
    var media = Math.round(numRaces / 2);
    var round = [];
    
    if(utils.areAllSacredOrBlueUsed(config.tracks, numRaces))
        utils.restartUsability(config.tracks);

    for(var i = 0; i < numRaces; i++) {

        var random = Math.floor(Math.random() * (max + 1 - min)) + min - 1; 
        
        if(config.tracks[random].used || (config.tracks[random].banned && !includeBannedTracks))
            i--;
        else {
            if(config.tracks[random].blue && numBlueRaces < media)
                numBlueRaces++;
            else if(!config.tracks[random].blue && numSacredRaces < media)
                numSacredRaces++;
            else {
                i--;
                continue;
            }

            config.tracks[random].used = true;
            round.push(config.tracks[random].race.split(" | ")[1]);
        }
    }

    return round;
}

exports.finishLobby = async function(messagesArray, deleteMessageInHours, futureTask, lobbyChannel, users, tracks, lobby, averageRank, numMatch) {
    deleteMessageInFuture(messagesArray, deleteMessageInHours);
    if(futureTask != undefined) {
        futureTask.first.destroy();
        futureTask.second.destroy();
        lobbyChannel.send(getEmbedPlayerAndTracks(users, tracks));
        
        let scoresTemplate = await generateScoresTemplate(lobby, users, await this.saveLobby(lobby, users, averageRank, numMatch));
        lobbyChannel.send(scoresTemplate);
    }
}

exports.createPlayerIfNotExist = async function(user) {
    let player = await PlayerSchema.findOne({ discordId: user.id }).exec();
    if(player == null) {
        player = await PlayerSchema.create({
            discordId: user.id,
            discordUserName: user.username
        });
    }

    return player;
}

exports.getPlayer = async function (user) {
    return await getPlayerInfo(user);
}

exports.isRegistered = async function (user) {
    let player = await PlayerSchema.findOne({ discordId: user.id }).exec();
    return player != null && player.playerName != undefined;
}

exports.saveLobby = async function (lobby, users, averageRank, numMatch) {
    
    if(numMatch == 0) {
        await MatchSchema.where({}).countDocuments(function(err, count) {
            if(err) { console.log(err); return; }
            numMatch = count;
        });
    }

    let update = {
        uuid: utils.generateUUID(),
        matchNumber: numMatch,
        lobbyModality: lobby,
        players: await getPlayersInfo(users),
        averageRank: averageRank
    };
    let filter = { matchNumber: numMatch };
    let options = {
        new: true,
        upsert: true  
    };

    await MatchSchema.findOneAndUpdate(filter, update, options).exec();        
 
    return numMatch;             
}

////////////////////////////////////////////////// PRIVATE FUNCTIONS



function deleteMessageInFuture(messagesArray, hours) {    
    let date = new Date();
    date.setHours(date.getHours() + hours);

    cron.schedule(date.getMinutes() + " " + date.getHours() + " * * *", () => {
        for(var i = 0; i < messagesArray.length; i++) {
            messagesArray[i].delete();
        }
    }, {
        scheduled: false,
        timezone: config.localTimeZone.timeZone
    }).start();
}

async function generateScoresTemplate(lobby, users, numMatch) {
    const ceros = getScoresTemplateCeros(lobby) + "\n";
    let template = "Match #" + numMatch + "# - " + lobby + "\n\n";

    // hacer switch en un futuro
    if(lobby == "FFA") {
        for(const user of users) {
            let playerInfo = await getPlayerInfo(user);
            let username = user.username.substring(config.maxCharacersPlayerName, 0).padEnd(config.maxCharacersPlayerName);  
            let flag = playerInfo == undefined ? " [VA] " : " [" + flags.flagCodeMap[playerInfo.flag] + "] ";
            if(playerInfo == undefined) { console.log("USUARIO INDEFINIDO:"); console.log(user); }
            template += (playerInfo.playerName != undefined ? playerInfo.playerName.padEnd(config.maxCharacersPlayerName, ' ') : username) + flag + ceros;
        }
    }

    const scoresTemplateEmbed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .addField("Scores template", template + "\n[Open template on gb.hlorenzi.com](https://gb.hlorenzi.com/table?data=" + encodeURI(template).replaceAll("#", "%23") + ")", true);

    return scoresTemplateEmbed;
}

function getEmbedPlayerAndTracks(users, tracks) {
    let usersString = "";
    users.forEach(element => usersString += "<@" + element + ">\n");   
    const newEmbed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .addField("Players", usersString, true)
        .addField("Tracks", tracks, true);
    return newEmbed;
}

async function getPlayersInfo(users) {
    let playersInfoArray = [];
    for(const user of users) {
        playersInfoArray.push(await getPlayerInfo(user));
    }

    return playersInfoArray;
}

async function getPlayerInfo(user) {
    let playerInfo = await PlayerSchema.findOne({ discordId: user.id }).exec();
    playerInfo.discordUserName = playerInfo.discordUserName.substring(config.maxCharacersPlayerName, 0).trimEnd();
        
    return playerInfo;
}

function getScoresTemplateCeros(lobby) {
    let ceros = "";
    for(var i = 0; i < config.lobbies[lobby].numRaces; i++) {
        ceros += "0|";
    }

    return ceros.slice(0, -1);
}

function isCorrectTime(time) {

    let format = config.hourFormat.horaMinutoUS;
    let correctTime = time.search("((1[0-2]|0?[0-9]):([0-5][0-9]) ?([AaPp][Mm]))") == 0 ? true : false;

    if(!correctTime) {
        correctTime = time.search("((1[0-2]|0?[0-9]) ?([AaPp][Mm]))") == 0 ? true : false;
        format = config.hourFormat.horaUS;
    }
    if(!correctTime) { 
        correctTime = time.search("(0[0-9]|1[0-9]|2[0-3]|[0-9])") == 0 ? true : false;
        format = config.hourFormat.horaEU;
    }
    if(time.includes == "0:")
        correctTime = false;

    return {correctTime, format};
}

function getFormatedTimeZones(time, emojiTimeZone, format) {
    
    let hours = time.split(":")[0];
    hours = hours.split(" ")[0];
    let minutes = 0;
    
    if(format == config.hourFormat.horaMinutoUS || format == config.hourFormat.horaUS) {
        hours = parseInt(hours) + (time.indexOf("pm") != -1 ? parseInt(12) : parseInt(0));
        
        if(format == config.hourFormat.horaMinutoUS) {
            minutes = time.split(":")[1];
            minutes = minutes.split(" ")[0];
        }
    }

    time = new Date();
    let formatedTime = "";
    let chosenTimeZone = config.timeZones.find(timeZone => timeZone.emoji == emojiTimeZone);
    time.setHours(hours - chosenTimeZone.UTCZone.replace("UTC", "") + parseInt(config.localTimeZone.UTCDifference));
    time.setMinutes(minutes);

    for(const timeZoneObject of config.timeZones) {
        let timeLocaled = time.toLocaleTimeString("en-US", {timeZone: timeZoneObject.timeZone});
        if(minutes == 0) 
            timeLocaled = timeLocaled.split(":")[0] + " " + timeLocaled.split(" ")[1].toLowerCase();
        else
            timeLocaled = timeLocaled.split(":")[0] + ":" + timeLocaled.split(":")[1] + " " + timeLocaled.split(" ")[1].toLowerCase();

        formatedTime += timeLocaled + " " + timeZoneObject.name + "\n";
    }
    
    return formatedTime;
}

async function setLobbyLocalTime(message, timeZone, Discord, lobby){

    let filter = m => m.author.id === message.author.id;
    const title = "Set the hour for the lobby.";
    const color = "#FFFFFF";
    const formato = "hh:mm am/pm\nhh am/pm\nHH";

    const embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(title)
                    .addField("Format", formato, true);

    message.channel.send(embed).then(() => {
        message.channel.awaitMessages(filter, {
            max: 1,
            time: 30000,
            errors: ['time']
            })
            .then(message => {
                message = message.first();
                
                let correctTime_format = isCorrectTime(message.content);

                if(correctTime_format.correctTime) {    
                    let time ;
                    try {
                        time = getFormatedTimeZones(message.content, timeZone, correctTime_format.format);
                        createLobby.execute(message, lobby, Discord, message.client, time);
                    } catch (error) {
                        console.error(error);
                    }
                }
                else
                    message.reply("terminated: Invalid Response");    
            })
            .catch(collected => {
                message.channel.send('Operation canceled: Timeout');
            });
    });
}

function isCorrectEmoji(emoji) {
    
    let correctEmoji = false;

    Object.values(config.timeZones).forEach(timeZone => {
        if(timeZone.emoji == emoji)
            correctEmoji = true;
    });

    return correctEmoji;
}

function to24HH(localTimeZone) {
    let time = {};
    let params = localTimeZone.split(" ");
    
    if(!params[0].includes(":")) {
        if(params[0] != 12)
            time.hours = (params[1] == "pm" ? parseInt(params[0]) + 12 : params[0]);
        else if(params[1] == "am")
            time.hours = 24;
        else
            time.hours = 12
        time.minutes = 0;
    }
    else {
        if(params[0] != 12)
            time.hours = (params[1] == "pm" ? parseInt(params[0].split(":")[0]) + 12 : parseInt(params[0].split(":")[0]));
        else if(params[1] == "am")
            time.hours = 24;
        else
            time.hours = 12;
        time.minutes = parseInt(params[0].split(":")[1]);
    }

    return time;
}

function createCron(usersString, time, channel, notification) {    
    let timeNotification = {};
    timeNotification.minutes = time.minutes;
    timeNotification.hours = time.hours;

    if (timeNotification.minutes >= 0 && timeNotification.minutes < notification) {
        let rest = notification - timeNotification.minutes;
        timeNotification.minutes = 60 - rest;
        timeNotification.hours = timeNotification.hours == 0 ? 23 : timeNotification.hours - 1;
    }
    else {
        timeNotification.minutes -= notification;
    }

    return cron.schedule(timeNotification.minutes + " " + timeNotification.hours + " * * *", () => {
        if(usersString != "") {
            channel.send(usersString + "\nThe ranked is going to start in " + notification + " min");
        }
    }, {
        scheduled: false,
        timezone: config.localTimeZone.timeZone
    });
}