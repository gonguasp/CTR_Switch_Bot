require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const rankUtils = require('@utils/rankUtils.js');
const Discord = require("discord.js");
const mongoDB = require("./db/connect.js");
const ParametersSchema = require('@models/ParametersSchema.js');
const client = new Discord.Client({ retryLimit: 10 });


mongoDB.connectDB();
client.commands = utils.readCommands(client);

client.on("message", message => {
    let command;
    try {
        if(message.content.startsWith("! ")) { message.reply("you have to write the command just before the prefix ! without spaces"); return; }
        if(message.guild != null) { rankUtils.processIfRankedResults(message); }
        if(!message.content.startsWith(config.prefix) || message.author.bot) { return; }

        const args = message.content.slice(config.prefix.length).split(" ");
        command = args.shift().toLowerCase();
        utils.executeCommand(message, args, Discord, client, command);
    } catch (error) {
        console.error(error + "\ncommand =" + command);
        message.reply('there was an error trying to execute that command!');
    }
});

client.on("guildMemberAdd", member => {
    utils.sendRandomMeme(member);    
});

client.once("ready", () => {
    console.log("CTR_SwitchBot is online! Active since " + new Date().toISOString());
});

ParametersSchema.findOne({ description: 'loginToken' }).exec().then(loginToken => {
    client.login(loginToken.name);
});
