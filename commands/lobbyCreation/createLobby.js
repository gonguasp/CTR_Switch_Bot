require("module-alias/register");
const config = require('@config');
const utils = require('@utils/utils.js');
const lobbyUtils = require('@utils/lobbyUtils.js');
const rankUtils = require('@utils/rankUtils.js');

module.exports = {
    name: "createlobby",
    description: "creates the lobby in the right channel",
    guildOnly: true,
    public: false,
    async execute(message, lobby, Discord, client, args) {
        const numTracks = config.lobbies[lobby].numRaces;
        const time = args != "" ? args : "5 pm Mexico\n6 pm New York\n12 am Madrid\n6 am Jakarta/Indonesia\n";
        const title = ":bust_in_silhouette:    New ranked " + lobby + " lobby";
        const color = "#FFFFFF";
        const maxPlayersPerLobby = config.lobbies[lobby].maxPlayers;
        const minPlayersPerLobby = config.lobbies[lobby].minsPlayers;
        const notifications = [5, 30];
        const deleteMessageInHours = 2;
        const lobbyChannel = utils.getChannelByName(message, config.lobbies[lobby].channel);

        let lobbyCompleted = false;
        let futureTask = undefined;
        let role = utils.getRoleByName(message, config.rankedRole);
        let tracks = "";
        let usersAndFlags = new Map();
        let playersRank = [];
        let averageRank = 0;
        
        let channel = utils.getChannelByName(message, config.rankedLobbiesChannel);
        if(!channel)
            channel = message.channel;

        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .addField("Time", time, true);

        let rankedMessage = await channel.send("<@&" + role.id + ">");
        let messageEmbed = await channel.send(embed);
        messageEmbed.react(config.emojis.confirm);
        
        const filter = (reaction, user) => {
            return reaction.emoji.name === config.emojis.confirm && !user.bot;
        };
        
        const collector = messageEmbed.createReactionCollector(filter, { dispose: true, time: lobbyUtils.getLobbyDuration(time) });

        collector.on('collect', async (reaction, user) => {
            let playerRankString = "";
            try {
                if(await lobbyUtils.isRegistered(reaction, user)) {
                    let playerRank = await rankUtils.findPlayerRank(user);
                    playersRank.push(rankUtils.getRankInfo(lobby, playerRank));
                    playersRank.forEach(element => playerRankString += element.playerName + " [" + element.rank + "]\n");          
                
                    let usersString = "";
                    usersAndFlags.set(user, (playerRank.player == undefined ? config.defaultFlag : playerRank.player.flag) + " <@" + user.id + ">\n");
                    usersAndFlags.forEach(element => usersString += element); 
                    averageRank = rankUtils.calculateAverageRank(playersRank);

                    const newEmbed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(title)
                        .addField("\nPlayers", usersString, true)
                        .addField("\nIDs & Ranks", "```" + playerRankString + "```", true)
                        .addField("\nAverage rank", averageRank, true)
                        .addField("Time", time, true);

                    if(usersAndFlags.size <= maxPlayersPerLobby) {
                        lobbyCompleted = usersAndFlags.size == maxPlayersPerLobby;
                        if(usersAndFlags.size >= minPlayersPerLobby) {
                            if(tracks == "") {
                                tracks = lobbyUtils.genTracks(numTracks);
                            }
                            newEmbed.addField("Tracks", tracks, true);
                            futureTask = lobbyUtils.scheduleLobbyNotification(lobby, futureTask, Array.from(usersAndFlags.keys()), lobbyUtils.parseTime(time), message, notifications);
                            futureTask.first.start();
                            futureTask.second.start();
                        }
                        messageEmbed.edit(newEmbed);
                    }
                    else if(usersAndFlags.size > maxPlayersPerLobby) {
                        await reaction.users.remove(user.id);
                        lobbyChannel.send("<@" + user.id + ">, the lobby is full by the moment. Stay focus just in case there is a vacancy in the near future");
                    }
                }
                else {
                    await reaction.users.remove(user.id);
                    let answer = "before to sign up a lobby you must set your player name, use !set_player_name or !spn.\n\n" + 
                                 "Example:\n!set_player_name <your player name>\n!spn <your player name>";
                    lobbyChannel.send("<@" + user.id + ">, " + answer);
                }
            } catch(err) { console.log(err); }
        });

        collector.on('remove', async (reaction, user) => {  
            if(await lobbyUtils.isRegistered(reaction, user)) {
                lobbyCompleted = false;
                let usersString = "";
                let playerRankString = "";
                usersAndFlags.delete(user);
                usersAndFlags.forEach(element => usersString += element);

                let playerRank = await rankUtils.findPlayerRank(user);
                playerRank = rankUtils.getRankInfo(lobby, playerRank);
                playersRank = playersRank.filter(item => item.id !== playerRank.id);  
                playersRank.forEach(element => playerRankString += element.playerName + " [" + element.rank + "]\n");
                
                averageRank = rankUtils.calculateAverageRank(playersRank);

                const newEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(title);

                if(usersString != "") {
                    newEmbed.addField("\nPlayers", usersString, true)
                            .addField("\nIDs & Ranks", playerRankString, true)
                            .addField("\nAverage rank", averageRank, true);
                }

                newEmbed.addField("Time", time, true);

                if(usersAndFlags.size >= minPlayersPerLobby) {
                    if(tracks != "") {
                        newEmbed.addField("Tracks", tracks, true);
                    }        
                    futureTask = lobbyUtils.scheduleLobbyNotification(lobby, futureTask, Array.from(usersAndFlags.keys()), lobbyUtils.parseTime(time), message, notifications);
                    futureTask.first.start();
                    futureTask.second.start();
                }
                else if(futureTask != undefined) {
                    futureTask.first.destroy();
                    futureTask.second.destroy();
                }

                messageEmbed.edit(newEmbed);
            }
        });

        collector.on('end', async (reaction, user) => {
            let messagesArray = [messageEmbed, rankedMessage];
            lobbyUtils.finishLobby(messagesArray, deleteMessageInHours, futureTask, lobbyChannel, Array.from(usersAndFlags.keys()), tracks, lobby, averageRank);
        });
    }

}