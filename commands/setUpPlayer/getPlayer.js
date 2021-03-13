require("module-alias/register");

const PlayerSchema = require('@models/PlayerSchema.js');
const utils = require('@utils/utils.js');

module.exports = {
    name: "get_player",
    description: "gets all the info in the database about the player",
    aliases: "gp",
    args: false,
    usage: "",
    guildOnly: true,
    public: true,
    execute(message, args, Discord, client)  {

        let player = PlayerSchema.where({ discordId: message.author.id });
        player.findOne(async function (err, playerResponse) {
            if(err) { console.log(err); return; }
            if(playerResponse) {
                let playerDTO = {};
                playerDTO.discordId = playerResponse.discordId;
                playerDTO.discordUserName = playerResponse.discordUserName;
                playerDTO.playerName = playerResponse.playerName;
                playerDTO.friendCode = playerResponse.friendCode;
                playerDTO.clan = playerResponse.clan;
                playerDTO.flag = playerResponse.flag;
                playerDTO.region = playerResponse.region;
                playerDTO.languages = playerResponse.languages.length == 0 ? undefined : playerResponse.languages;
                playerDTO.discordVC = playerResponse.discordVC ? "yes" : "no";
                playerDTO.nat = playerResponse.nat;
                playerDTO.timeZone = playerResponse.timeZon;
                playerDTO.favCharacter = playerResponse.favCharacter;
                playerDTO.favTrack = playerResponse.favTrack;
                message.reply("\n" + JSON.stringify(playerDTO, null, '\t\t').replaceAll("\"", ""));
            }
            else {
                message.reply("you didn't add any info. Let's starts with the command '!set_profile_name' or '!spn'.");  
            }
        });
    }
}
