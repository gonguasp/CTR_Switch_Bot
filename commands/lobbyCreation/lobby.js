require("module-alias/register");

const config = require('@config');
const utils = require('@utils/utils.js');
const createLobby = require("@cmdLobbyCreation/createLobby.js");
const setLobbyTimeZone = require("@cmdLobbyCreation/setLobbyTimeZone.js");

module.exports = {
    name: "lobby",
    description: "lobby creation",
    aliases: ["l"],
    args: false,
    usage: ["", "custom"],
    guildOnly: true,
    public: true,
    execute(message, args, Discord, client) {

        const roles = [];
        roles.push(config.rankedRole);

        if(!utils.userHasRoles(message, roles)) {
            message.reply("you don't have the role/s " + roles + " to execute that command");
            return;
        }
        
        let filter = m => m.author.id === message.author.id;
        let lobbies = "";

        for(let i = 0; i < config.lobbies.length; i++) {
            lobbies += (i + 1) + " - " + config.lobbies[i];
            if(i + 1 < config.lobbies.length) lobbies += "\n ";
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

                    if(config.lobbies[message.content - 1] != undefined) {
                        message.channel.send(config.lobbies[message.content - 1] + " lobby selected");    
                        
                        if(args[0] != "custom")
                            createLobby.execute(message, config.lobbies[message.content - 1], Discord, client, args);
                        else 
                            setLobbyTimeZone.execute(message, Discord, config.lobbies[message.content - 1]);
                    }
                    else
                        message.reply("terminated: Invalid Response");    
                })
                .catch(collected => {
                    message.channel.send('Operation canceled: Timeout');
                });
        });
    }
}