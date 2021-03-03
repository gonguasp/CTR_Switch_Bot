require("module-alias/register");
const config = require('@config');
const utils = require('@utils/utils.js');
const lobbyUtils = require('@utils/lobbyUtils.js');

module.exports = {
    name: "createlobby",
    description: "creates the lobby in the right channel",
    guildOnly: true,
    public: false,
    async execute(message, lobby, Discord, client, args) {

        const numTracks = config.lobbies[lobby].numRaces;
        const confirmReaction = "✅";
        const time = args != "" ? args : "5 pm Mexico\n6 pm New York\n12 am Madrid\n";
        const footer = "React with " + confirmReaction +  " if you're interested";
        const title = ":bust_in_silhouette:    New ranked " + lobby + " lobby";
        const color = "#FFFFFF";
        const maxPlayersPerLobby = 8;
        const notifications = [5, 30];

        let lobbyCompleted = false;
        let futureTask = undefined;
        let role = utils.getRoleByName(message, config.rankedRole);
        let minPlayersPerLobby = config.lobbies[lobby].minsPlayers;
        let tracks = "";
        
        let channel = utils.getChannelByName(message, config.rankedLobbiesChannel);
        if(!channel)
            channel = message.channel;

        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .addField("Time", time, true)
            .setFooter(footer);

        let rankedMessage = await channel.send("<@&" + role.id + ">");
        let messageEmbed = await channel.send(embed);
        messageEmbed.react(confirmReaction);
        let users = [];
        
        const filter = (reaction, user) => {
            return reaction.emoji.name === confirmReaction && !user.bot;
        };
        
        const collector = messageEmbed.createReactionCollector(filter, { dispose: true, time: lobbyUtils.getLobbyDuration(time) });

        collector.on('collect', async (reaction, user) => {
            let usersString = "";
            users.push(user);
            users.forEach(element => usersString += "<@" + element + ">\n");            

            lobbyUtils.generateScoresTemplate(lobby, users);

            const newEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .addField("\nPlayers", usersString, true)
                .addField("Time", time, true)
                .setFooter(footer);

            if(users.length <= maxPlayersPerLobby) {
                lobbyCompleted = users.length == maxPlayersPerLobby;
                if(users.length >= minPlayersPerLobby) {
                    if(tracks == "") {
                        tracks = lobbyUtils.genTracks(numTracks);
                    }
                    newEmbed.addField("Tracks", tracks, true);
                    try {
                        futureTask = lobbyUtils.scheduleLobbyNotification(lobby, futureTask, usersString, lobbyUtils.parseTime(time), message, notifications);
                        futureTask.first.start();
                        futureTask.second.start();
                    } catch (error) {
                        console.log(error);
                    }
                }
                messageEmbed.edit(newEmbed);
            }
            else if(users.length > maxPlayersPerLobby) {
                await reaction.users.remove(user.id);
                let lobbyChannel = utils.getChannelByName(message, config.lobbies[lobby].channel);
                lobbyChannel.send("<@" + user.id + ">, the lobby is full by the moment. Stay focus just in case there is a vacancy in the near future");
            }
        });

        collector.on('remove', async (reaction, user) => {  
            lobbyCompleted = false;
            let usersString = "";
            users = users.filter(item => item !== user);
            users.forEach(element => usersString += "<@" + element + ">\n");            

            lobbyUtils.generateScoresTemplate(lobby, users);

            const newEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .setFooter(footer);

            if(usersString != "")
                newEmbed.addField("\nPlayers", usersString, true);

            newEmbed.addField("Time", time, true);

            if(users.length >= minPlayersPerLobby) {
                if(tracks != "") {
                    newEmbed.addField("Tracks", tracks, true);
                }
                try {
                    futureTask = lobbyUtils.scheduleLobbyNotification(lobby, futureTask, usersString, lobbyUtils.parseTime(time), message, notifications);
                    futureTask.first.start();
                    futureTask.second.start();
                } catch (error) {
                    console.log(error);
                }
            }
            else if(futureTask != undefined) {
                try {
                    futureTask.first.destroy();
                    futureTask.second.destroy();
                } catch (error) {
                    console.log(error);
                }
            }

            messageEmbed.edit(newEmbed);
        });

        collector.on('end', async (reaction, user) => {
            messageEmbed.delete();
            rankedMessage.delete();
            if(futureTask != undefined) {
                futureTask.first.destroy();
                futureTask.second.destroy();
            }
        });
    }
}