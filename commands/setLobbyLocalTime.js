const createLobby = require("../commands/createLobby.js");
const localTimeFunctions = require('./lobbyCreation/localTimeFunctions.js');

module.exports = {
    name: "setLobbyLocalTime",
    description: "sets the local time for a lobby",
    async execute(message, timeZone, Discord, lobby){

        let filter = m => m.author.id === message.author.id;
        const title = "Set the hour for the lobby.";
        const color = "#FFFFFF";
        const formato = "hh:mm am/pm\nhh am/pm\nHH";

        const embed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(title)
                        .addField("Format", formato, true);

        message.channel.send(embed).then(() => {
            message.channel.awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
                })
                .then(message => {
                    message = message.first();
                    
                    let correctTime = localTimeFunctions.isCorrectTime(message.content);

                    if(correctTime) {    
                        let time = localTimeFunctions.getFormatedTimeZones(message.content, timeZone);
                        console.log(time);
                        try {
                            createLobby.execute(message, lobby, Discord, message.client, time);
                        } catch (error) {
                            console.error(error);
                        }
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