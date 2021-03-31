require("module-alias/register");

const PlayerSchema = require('@models/PlayerSchema.js');
const utils = require('@utils/utils.js');
const rankUtils = require('@utils/rankUtils.js');
const config = require('@config');

module.exports = {
    name: "set_flag",
    description: "set the profile name for the user player",
    aliases: ["sf", "set_country", "sc"],
    args: false,
    usage: "",
    guildOnly: true,
    public: true,
    example: "!set_flag 🇻🇦\n!set_falg",
    permissions: false,
    async execute(message, args, Discord, client)  {

        let update = {
            discordId: message.author.id,
            discordUserName: message.author.username.substring(config.maxCharacersPlayerName, 0).trimEnd(),
        };
        let filter = { discordId: message.author.id };
        let options = {
            new: true,
            upsert: true  
        };

        if(utils.isCountryFlag(args[0])) {
            let countryName = utils.getCountryNameByFlag(args[0]);
            update.flag = args[0];
            await PlayerSchema.findOneAndUpdate(filter, update, options).exec();        
            message.channel.send("flag updated to " + args[0] + ", " + countryName);
        }
        else {
            let flagMessage = await message.channel.send("React with the flag emote from your country to this message.");
            flagMessage.awaitReactions((reaction, user) => user.id == message.author.id, { 
                max: 1, time: 60000 }).then(async (collected) => {
                    let emoji = collected.first().emoji.name;
                    if (utils.isCountryFlag(emoji)) {
                        let countryName = utils.getCountryNameByFlag(emoji);
                        update.flag = emoji;
                        await PlayerSchema.findOneAndUpdate(filter, update, options).exec();
                        message.channel.send("flag updated to " + emoji + ", " + countryName);
                    }
                    else
                        message.reply(emoji + " is not a valid country flag!");
            }).catch(() => {
                message.reply("Operation canceled: Timeout");
            }); 
        }
    }
}