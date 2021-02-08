const config = require('../config/config.json');
const createLobby = require("../commands/createLobby.js");

module.exports = {
    name: "lobby",
    description: "lobby creation",
    execute(message, args, Discord, client){
        let filter = m => m.author.id === message.author.id;
        let custom = (message.content == "-lobby custom" || message.content == "-l custom") ? true : false;

        let lobbies = "";
        for(let i = 0; i < config.lobbies.length; i++) {
            lobbies += (i + 1) + " - " + config.lobbies[i];
            if(i + 1 < config.lobbies.length) lobbies += "\n ";
        }

        const newEmbed = new Discord.MessageEmbed()
            .setColor("#FFFFFF")
            .setTitle(":information_source: Info")
            .addField("\nSelect lobby mode. Waiting 1 minute", "\`\`\` " + lobbies + "\`\`\`", true);

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
                        createLobby.execute(message, config.lobbies[message.content - 1], Discord, client, args);
                    }
                    else
                        message.channel.send("Terminated: Invalid Response");    
                })
                .catch(collected => {
                    message.channel.send('Timeout');
                });
        });
    }
}