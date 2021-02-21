require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const Discord = require("discord.js");
const client = new Discord.Client();

client.commands = utils.readCommands(client);


client.on("message", message => {
    try {
        if(!message.content.startsWith(config.prefix) || message.author.bot)
            return;

        const args = message.content.slice(config.prefix.length).split(" ");
        let command = args.shift().toLowerCase();
        utils.executeCommand(message, args, Discord, client, command);
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