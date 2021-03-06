require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const Discord = require("discord.js");
const mongoose = require("mongoose");
const client = new Discord.Client(/*{retryLimit: 10}*/);


mongoose.connect(config.mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    userFindAndModify: false
}).then(() => {
    console.log("conxion con la base de datos exitosa");
}).catch((err) => {
    console.log(err);
});

client.commands = utils.readCommands(client);

client.on("message", message => {
    let command;
    try {
        utils.processIfRankedResults(message);

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

client.on("guildMemberAdd", member => {
    try {
        const channel = utils.getChannelByName(member, "⭐welcome");
        if (!channel) return;

        let memes = utils.getWelcomeMemes();
        let image = memes[Math.floor(Math.random() * memes.length)];

        channel.send(`Welcome to the server, ${member}!`, {files: [config.welcomeMemesDir + image]});
    } catch (error) {
        console.log(error);
    }
});

client.on("uncaughtException", (err) => {
    console.error("EXCEPTION UNCAUGHT = \n" + err);
});

client.on("unhandledRejection", (reason, promise) => {
    console.error("REJECTION UNHANDLED = \n" + reason.stack || reason);
});

client.on("error", (code) => {
    console.error("ERROR OCURRED = \n" + code);
});

client.once("exit", () => {
    console.log("Turning off...");
});

client.once("ready", () => {
    console.log("CTR_SwitchBot is online!");
    console.log("Active since " + new Date().toISOString());
});

client.login(config.token);