//const utils = require('./utils/utils.js');
const config = require('./config/config.json');

const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(config.commandsDir).filter(file => file.endsWith(".js"));

for(const file of commandFiles){
    const command = require(config.commandsDir + file);
    client.commands.set(command.name, command);
    if(command.aliases != undefined) {
        command.aliases.forEach(alias => {
            client.commands.set(alias, command);
        });
    }
}

client.on("message", message => {
    if(!message.content.startsWith(config.prefix) || message.author.bot)
        return;

    const args = message.content.slice(config.prefix.length).split(" ");
    const command = args.shift().toLowerCase();
    
    try {
        client.commands.get(command).execute(message, args, Discord, client);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
        console.log("command = " + command);
    }
});

client.once("ready", () => {
    console.log("CTR_SwitchBot is online!");
});

client.login(config.token);