require("module-alias/register");

const PlayerSchema = require('@models/PlayerSchema.js');
const config = require('@config');
const rankUtils = require('@utils/rankUtils.js');

module.exports = {
    name: "set_player_name",
    description: "set the profile name for the user player",
    aliases: ["spn"],
    args: false,
    usage: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client)  {

        if(args[0] == undefined) {
            message.reply("you have to add your player name as first argument of the command.\nExample !set_player_name <playerName>");
            return;
        } 

        if(args[0].length > config.maxCharacersPlayerName) {
            message.reply("max characters for the name are 9");
            return;
        }

        let player = await PlayerSchema.findOne({ playerName: args[0] }).exec();
        if(player != null && player.discordId != message.author.id) {
            message.reply("the user " + player.discordUserName + " already has that player name and duplicates are not allowed.");
            return;
        }

        let update = {
            discordId: message.author.id,
            discordUserName: message.author.username.substring(config.maxCharacersPlayerName, 0).trimEnd(),
            playerName: args[0]
        };
        let filter = { discordId: message.author.id };
        let options = {
            new: true,
            upsert: true  
        };

        await PlayerSchema.findOneAndUpdate(filter, update, options).exec();
        await rankUtils.createOrEditPlayerRank(message.author, args[0]);
        
        message.channel.send("updated to " + args[0] + "!");        
    }
}