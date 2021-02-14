require("module-alias/register");
const config = require('@config');

const genTracks = require("@cmdLobbyCreation/genTracks.js");

module.exports = {
    name: "createlobby",
    description: "creates the lobby in the right channel",
    guildOnly: true,
    public: false,
    async execute(message, lobby, Discord, client, args) {

        const confirmReaction = "✅";
        const time = args != "" ? args : "5 pm Mexico\n6 pm New York\n12 am Madrid\n";
        const footer = "React with " + confirmReaction +  " if you're interested";
        const title = ":bust_in_silhouette:    New ranked " + lobby + " lobby";
        const color = "#FFFFFF";
        let lobbyCompleted = false;
        let playersPerLobby = 8;

        let channel = message.guild.channels.cache.find(ch => ch.name == config.rankedLobbiesChannel);
        if(!channel)
            channel = message.channel;

        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .addField("Time", time, true)
            .setFooter(footer);

        let messageEmbed = await channel.send(embed);
        messageEmbed.react(confirmReaction);
        let users = [];

        client.on("messageReactionAdd", async (reaction, user) => {
            if(messageEmbed.id != reaction.message.id || user.bot || !reaction.message.guild) return;
            if(reaction.message.partial) await reaction.message.fetch();
            if(reaction.partial) await reaction.fetch();
            
            let usersString = "";
            users.push(user);
            users.forEach(element => usersString += "<@" + element + ">\n");

            const newEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .addField("\nPlayers", usersString, true)
                .addField("Time", time, true)
                .setFooter(footer);

            if(reaction.message.channel == channel && users.length <= playersPerLobby) {
                if(users.length == playersPerLobby) {
                    lobbyCompleted = true;
                    newEmbed.addField("Tracks", genTracks.execute(), true);
                }
                messageEmbed.edit(newEmbed);
            }
            else if(reaction.message.channel == channel && users.length > playersPerLobby) {
                await reaction.users.remove(user.id);
                channel.send("<@" + user.id + ">, the lobby is full by the moment. Stay focus just in case there is a vacancy in the near future");
            }
        });

        client.on("messageReactionRemove", async (reaction, user) => {
            if(messageEmbed.id != reaction.message.id || user.bot || !reaction.message.guild) return;
            if(reaction.message.partial) await reaction.message.fetch();
            if(reaction.partial) await reaction.fetch();
            
            if(reaction.message.channel == channel) {
                lobbyCompleted = false;
                let usersString = "";
                users = users.filter(item => item !== user);
                users.forEach(element => usersString += "<@" + element + ">\n");

                const newEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(title)
                    .setFooter(footer);

                if(usersString != "")
                    newEmbed.addField("\nPlayers", usersString, true);

                newEmbed.addField("Time", time, true);

                messageEmbed.edit(newEmbed);
            }
        });
    }
}