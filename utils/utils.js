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
    
    command = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));;
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('I can\'t execute that command inside DMs!');
    }
    
    if(!command.public) {
        return message.reply('This is a private command and I can\'t execute!');
    }

    command.execute(message, args, Discord, client);
}