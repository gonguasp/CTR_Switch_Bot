require("module-alias/register");

const PlayerSchema = require('@models/PlayerSchema.js');

module.exports = {
    name: "set_profile_name",
    description: "set the profile name for the user player",
    aliases: ["spn"],
    args: false,
    usage: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client)  {

        if(args[0].length > 9) {
            message.channel.send("Max character for the name are 9");
            return;
        }

        PlayerSchema.where("profileName");
        let player = PlayerSchema.where({ discordId: message.author.id })
        player.findOne(async function (err, playerResponse) {
            if(err) { console.log(err); return; }
            if(playerResponse) {
                player.updateOne({ $set: { profileName: args[0] }}).exec();
                message.channel.send("updated to " + args[0] + "");
            }
            else {
                player = await PlayerSchema.create({
                    discordId: message.author.id,
                    profileName: args[0]
                });
        
                player.save();
                message.channel.send("created to " + args[0] + "!");
            }
        });
    }
}