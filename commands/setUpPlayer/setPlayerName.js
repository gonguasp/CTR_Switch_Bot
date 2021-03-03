require("module-alias/register");

const PlayerSchema = require('@models/PlayerSchema.js');
const config = require('@config');

module.exports = {
    name: "set_player_name",
    description: "set the profile name for the user player",
    aliases: ["spn"],
    args: false,
    usage: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client)  {

        if(args[0].length > config.maxCharacersPlayerName) {
            message.channel.send("Max character for the name are 9");
            return;
        }

        PlayerSchema.where("playerName");
        let player = PlayerSchema.where({ discordId: message.author.id })
        player.findOne(async function (err, playerResponse) {
            if(err) { console.log(err); return; }
            if(playerResponse) {
                player.updateOne({ $set: { playerName: args[0] }}).exec();
                message.channel.send("updated to " + args[0] + "");
            }
            else {
                player = await PlayerSchema.create({
                    discordId: message.author.id,
                    discordUserName: message.author.username,
                    playerName: args[0]
                });
        
                player.save();
                message.channel.send("created to " + args[0] + "!");
            }
        });
    }
}