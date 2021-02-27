require("module-alias/register");

const config = require('@config');
const Discord = require("discord.js");
const fs = require("fs");

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
        images = fs.readdirSync(config.welcomeMemesDir).filter(file => file.endsWith(extension));
    }
    
    return images;
}