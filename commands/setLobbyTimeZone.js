const setLobbyLocalTime = require("./setLobbyLocalTime.js");
const config = require('../config/config.json');
const timeZoneFunctions = require('../commands/lobbyCreation/timeZoneFunctions.js');

module.exports = {
    name: "setLobbyTimeZone",
    description: "sets the time zone for a lobby",
    async execute(message, Discord, lobby){

        const channel = message.channel;
        const title = "Set a timezone.";
        const color = "#FFFFFF";
        let time = "";
        Object.values(config.timeZones).forEach(timeZone => {
            time += config.timeZonesData[timeZone].emoji + "  " + config.timeZonesData[timeZone].UTCZone + " " + timeZone + "\n";
        });
        time = time.replace("NewYork", "New York");

        const embed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(title)
                        .addField("Time", time, true);

        let messageEmbed = await channel.send(embed);
                    
        Object.values(config.timeZones).forEach(timeZone => {
            messageEmbed.react(config.timeZonesData[timeZone].emoji);
        });

        messageEmbed.awaitReactions((reaction, user) => user.id == message.author.id, { 
            max: 1, time: 30000 }).then(collected => {
                let emoji = collected.first().emoji.name;
                if (timeZoneFunctions.isCorrectEmoji(emoji)) {
                    message.channel.send("Selected " + emoji + " timezone!");
                    setLobbyLocalTime.execute(message, emoji, Discord, lobby);
                }
                else
                    message.reply("terminated: Invalid Response");
        }).catch(() => {
            message.reply("Operation canceled: Timeout");
        });     
    }
}