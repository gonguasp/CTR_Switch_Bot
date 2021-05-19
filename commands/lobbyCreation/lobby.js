require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const createLobby = require("@cmdLobbyCreation/createLobby.js");
const lobbyUtils = require('@utils/lobbyUtils.js');

module.exports = {
    name: "lobby",
    description: "lobby creation or close",
    aliases: ["l"],
    args: false,
    usage: ["", "custom", "end"],
    guildOnly: true,
    public: true,
    example: "!lobby\n!lobby custom\n!lobby end",
    permissions: false,
    async execute(message, args, Discord, client) {

        // when developing uncomment next block
        /*if(message.author.id != "712342385463394456") {
            message.reply("sorry the inconveniences, the developer is adding new feature to me, try it later"); 
            return;
        }*/

        if(args.length > 1) { message.reply("not valid arguments"); return; }
        if(args.length == 1 && args[0] != "custom" && args[0] != "end") { message.reply("not a valid argument"); return; }

        const roles = [];
        roles.push(config.rankedRole);

        if(!utils.userHasRoles(message, roles)) {
            message.reply("you don't have the role/s " + roles + " to execute that command");
            return;
        }

        if(args.length == 1 && args[0] == "end") { await lobbyUtils.closeLobby(message); return; }
        
        let filter = m => m.author.id === message.author.id;
        let lobbies = "";
        let lobbiesNames = Object.getOwnPropertyNames(config.lobbies);

        for(let i = 0; i < lobbiesNames.length; i++) {
            lobbies += (i + 1) + " - " + lobbiesNames[i];
            if(i + 1 < lobbiesNames.length) lobbies += "\n ";
        }

        const newEmbed = new Discord.MessageEmbed()
            .setColor("#FFFFFF")
            .setTitle(":information_source: Info")
            .addField("\nSelect lobby mode. Waiting 1 minute.", "\`\`\` " + lobbies + "\`\`\`", true);

        message.channel.send(newEmbed).then(() => {
            message.channel.awaitMessages(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
                })
                .then(message => {
                    message = message.first();

                    if(lobbiesNames[message.content - 1] != undefined) {
                        message.channel.send(lobbiesNames[message.content - 1] + " lobby selected");    
                        
                        if(args[0] != "custom") {
                            createLobby.execute(message, lobbiesNames[message.content - 1], Discord, client, "");
                        }
                        else {
                            lobbyUtils.setLobbyTimeZone(message, Discord, lobbiesNames[message.content - 1], createLobby);
                        }
                    }
                    else {
                        message.reply("terminated: Invalid Response");    
                    }
                })
                .catch(collected => {
                    message.channel.send('Operation canceled: Timeout');
                });
        });
    }
}