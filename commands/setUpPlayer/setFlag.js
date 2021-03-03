require("module-alias/register");

const PlayerSchema = require('@models/PlayerSchema.js');
const utils = require('@utils/utils.js');

module.exports = {
    name: "set_flag",
    description: "set the profile name for the user player",
    aliases: ["sf", "set_country", "sc"],
    args: false,
    usage: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client)  {

        let flagMessage = await message.channel.send("React with the flag emote from your country to this message.");

        flagMessage.awaitReactions((reaction, user) => user.id == message.author.id, { 
            max: 1, time: 60000 }).then(collected => {
                let emoji = collected.first().emoji.name;
                if (utils.isCountryFlag(emoji)) {
                    let countryName = utils.getCountryNameByFlag(emoji);
                    let player = PlayerSchema.where({ discordId: message.author.id })
                    player.findOne(async function (err, playerResponse) {
                        if(err) { console.log(err); return; }
                        if(playerResponse) {
                            player.updateOne({ $set: { flag: emoji }}).exec();
                        }
                        else {
                            player = await PlayerSchema.create({
                                discordId: message.author.id,
                                discordUserName: message.author.username,
                                flag: emoji
                            });
                            player.save();
                        }
                        message.channel.send("flag updated to " + emoji + ", " + countryName);
                    });
                }
                else
                    message.reply(emoji + " is not a valid country flag!");
        }).catch(() => {
            message.reply("Operation canceled: Timeout");
        });   
    }
}