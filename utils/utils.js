require("module-alias/register");

const config = require('@config');
const flags = require('@flags');
const Discord = require("discord.js");
const fs = require("fs");
const MatchSchema = require('@models/MatchSchema.js');
const PlayerSchema = require('@models/PlayerSchema.js');

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
    if(command == undefined) {
        return message.reply('There is not any command ' + message.content);
    }
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

	return used == (array.length);
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

exports.sendRandomMeme = function (member) {
    try {
        const channel = this.getChannelByName(member, "⭐welcome");
        if (!channel) return;

        let memes = this.getWelcomeMemes();
        let image = memes[Math.floor(Math.random() * memes.length)];

        channel.send(`Welcome to the server, ${member}!`, {files: [config.welcomeMemesDir + image]});
    } catch (err) {
        console.log(err);
    }
}

exports.setBan = async function (userId, numDays, reason) {
    let date = new Date();
    date.setDate(date.getDate() + parseInt(numDays));
    let filter = { discordId: userId };
    let update = {
        bannedReason: reason,
        bannedUntil: date
    };
    await PlayerSchema.where(filter).updateOne(update).exec();    
}

exports.showBans = async function (filter) {
    let filterLocal = filter == undefined ? { bannedUntil: { $gt: new Date() }} : filter;
    let bans = await PlayerSchema.find(filterLocal, { discordUserName: 1, playerName: 1, bannedUntil: 1, bannedReason: 1 });
    let baneos = [];
    for(let i = 0; i < bans.length; i++) {
        let ban = {};
        ban.discordUserName = bans[i].discordUserName;
        ban.playerName = bans[i].playerName;
        ban.bannedUntil = bans[i].bannedUntil;
        ban.bannedReason = bans[i].bannedReason;
        baneos.push(ban);
    }
    return baneos;
}

exports.getBanneds = async function (ids) {
    let banneds = [];
    for(let id of ids) {
        let filter = { discordId: id, bannedUntil: { $gt: new Date() }};
        let ban = (await this.showBans(filter))[0];
        if(ban != undefined) {
            banneds.push(ban);
        }
    }
    return banneds;
}