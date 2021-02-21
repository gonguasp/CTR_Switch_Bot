require("module-alias/register");

const config = require('@config');
const setLobbyLocalTime = require("@cmdLobbyCreation/setLobbyLocalTime.js");
const timeZoneFunctions = require('@cmdLobbyCreation/timeZoneFunctions.js');

module.exports = {
    name: "setlobbytimezone",
    description: "sets the time zone for a lobby",
    guildOnly: true,
    public: false,
    async execute(message, Discord, lobby){

        const channel = message.channel;
        const title = "Set a timezone.";
        const color = "#FFFFFF";
        let time = "";
        Object.values(config.timeZones).forEach(timeZone => {
            time += timeZone.emoji + "  " + timeZone.UTCZone + " " + timeZone.name + "\n";
        });
        time = time.replace("NewYork", "New York");

        const embed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(title)
                        .addField("Time", time, true);

        let messageEmbed = await channel.send(embed);
                    
        Object.values(config.timeZones).forEach(async (timeZone) => {
            await messageEmbed.react(timeZone.emoji);
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