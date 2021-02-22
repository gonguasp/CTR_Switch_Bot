require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const Discord = require("discord.js");
const client = new Discord.Client();

client.commands = utils.readCommands(client);

client.on("message", message => {
    let command;
    try {
        if(!message.content.startsWith(config.prefix) || message.author.bot)
            return;

        const args = message.content.slice(config.prefix.length).split(" ");
        command = args.shift().toLowerCase();
        utils.executeCommand(message, args, Discord, client, command);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
        console.log("command =" + command);
    }
});

client.on("guildMemberAdd", async member => {
    try {
        const channel = utils.getChannelByName(member, "⭐️welcome");
        if (!channel) return;

        let memes = utils.getWelcomeMemes();
        let image = memes[Math.floor(Math.random() * memes.length)];

        channel.send(`Welcome to the server, ${member}!`, {files: [config.welcomeMemesDir + image]});
    } catch (error) {
        console.log(error);
    }
});


client.once("ready", () => {
    console.log("CTR_SwitchBot is online!");
});

client.login(config.token);