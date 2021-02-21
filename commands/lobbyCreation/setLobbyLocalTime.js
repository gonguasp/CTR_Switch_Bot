require("module-alias/register");

const createLobby = require("@cmdLobbyCreation/createLobby.js");
const localTimeFunctions = require('@cmdLobbyCreation/localTimeFunctions.js');

module.exports = {
    name: "setlobbylocaltime",
    description: "sets the local time for a lobby",
    guildOnly: true,
    public: false,
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
                    
                    let correctTime_format = localTimeFunctions.isCorrectTime(message.content);

                    if(correctTime_format.correctTime) {    
                        let time ;
                        try {
                            time = localTimeFunctions.getFormatedTimeZones(message.content, timeZone, correctTime_format.format);
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