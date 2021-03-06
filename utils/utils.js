require("module-alias/register");

const config = require('@config');
const flags = require('@flags');
const Discord = require("discord.js");
const fs = require("fs");
const MatchSchema = require('@models/MatchSchema.js');

exports.readCommands = function(client) {
    
    client.commands = new Discord.Collection();
    let commandFiles;

    for(const dir of config.commandsDirs) {
        commandFiles = fs.readdirSync(dir).filter(file => file.endsWith(".js"));

        for(const file of commandFiles) {
            const command = require(config.moduleAliases["@root"] + dir + file);
            if(command.name != undefined)
                client.commands.set(command.name, command);
        }
    }

    return client.commands;
}

exports.executeCommand = function(message, args, Discord, client, command) {
    
    command = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('I can\'t execute that command inside DMs!');
    }
    
    if(!command.public) {
        return message.reply('This is a private command and I can\'t execute!');
    }

    command.execute(message, args, Discord, client);
}

exports.areAllUsed = function(array) {
    
    let used = 0;

	for(var i = 0; i < array.length; i++)
		if(array[i].used)
			used++;

	return used == (array.length - 1);
}

exports.areAllSacredOrBlueUsed = function(tracks, numRaces) {

    let totalSacred = 18;
    let totalBlue = 19;

	for(var i = 0; i < tracks.length; i++) {
		if(tracks[i].used) {
            if(tracks[i].blue)
                totalBlue--;  
            else
                totalSacred--;          
        }
    }
    
    return totalSacred < (numRaces / 2) && totalSacred < (numRaces / 2);
}

exports.restartUsability = function(array) {
	for(var i = 0; i < array.length; i++)
        array[i].used = false;
}

exports.userHasRoles = function(message, roles) {
	const { guild } = message;
    const role = guild.roles.cache.find((role) => {return roles.includes(role.name)});
    if(role == undefined)
        return false;
    const member = guild.members.cache.get(message.author.id);

    return member.roles.cache.get(role.id) ? true : false;
}


exports.getChannelByName = function(obj, channelName) {
	return obj.guild.channels.cache.find(ch => ch.name == channelName);
}

exports.getChannelById = function(message, id) {
    id = id.replace("<#", "").replace(">", "");
	return message.guild.channels.cache.find(ch => ch.id == id);
}

exports.getRoleByName = function(message, roleName) {
	return message.guild.roles.cache.find(role => role.name == roleName);
}

exports.getWelcomeMemes = function() {
    let images = [];

    for(const extension of config.imagesExtensions) {
        let memes = (fs.readdirSync(config.welcomeMemesDir).filter(file => file.endsWith(extension)));
        for(const meme of memes) {
            images.push(meme);
        }
    }
    
    return images;
}

exports.isCountryFlag = function(flagEmoji) {
    return flags.flagName.hasOwnProperty(flagEmoji) && flags.flagCodeMap.hasOwnProperty(flagEmoji);
}

exports.getCountryNameByFlag = function(flagEmoji) {
    return flags.flagName[flagEmoji];
}

exports.generateUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.processIfRankedResults = async function(message) {
    const channel = message.guild.channels.cache.find(ch => ch.name == config.resultsRankedChannel);
    if(message.channel != channel) { return; }
    if(await isValidResult(message.content)) {
        console.log("valido");       
    }
    else {
        console.log("invalido");
    }
}

async function isValidResult(content) {
    let rankedInfo = await getRankedInfo(content);
    let valid = true;
    if(rankedInfo) {
        for(const player of rankedInfo.players) {
            let playerName = player.playerName != undefined ? player.playerName : player.discordUserName;
            if(content.search(playerName) == -1) {
                valid = false;
                break;
            }
        }

        if(valid) {
            let numPipes = (config.lobbies[rankedInfo.lobbyModality].numRaces - 1) * rankedInfo.players.length;
            let countPipes = content.split("|").length - 1;
            valid = numPipes == countPipes;
        }
    }
    else { valid = false; }

    return valid;
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