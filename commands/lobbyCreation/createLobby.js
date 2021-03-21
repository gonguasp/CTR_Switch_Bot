require("module-alias/register");
const config = require('@config');
const utils = require('@utils/utils.js');
const lobbyUtils = require('@utils/lobbyUtils.js');
const rankUtils = require('@utils/rankUtils.js');
const teamUtils = require('@utils/teamUtils.js');
const MatchSchema = require('@models/MatchSchema.js');
const TeamSchema = require('@models/TeamSchema.js');

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
        const minPlayersPerLobby = 1;//config.lobbies[lobby].minsPlayers;
        const notifications = [5, 30];
        const deleteMessageInHours = 2;
        const lobbyChannel = utils.getChannelByName(message, config.lobbies[lobby].channel);

        let lobbyCompleted = false;
        let futureTask = undefined;
        let role = utils.getRoleByName(message, config.lobbies[lobby].role);
        let tracks = "";
        let usersAndFlags = new Map();
        let playersRank = [];
        let averageRank = 0;

        let lobbyNumber = await lobbyUtils.saveLobby(lobby, [], 0, 0);        
        let channel = utils.getChannelByName(message, config.rankedLobbiesChannel);
        if(!channel)
            channel = message.channel;

        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .addField("Time", time, true);

        let rankedMessage = await channel.send("<@&" + role.id + ">");
        let messageEmbed = await channel.send(embed);
        await messageEmbed.react(config.emojis.confirm);
        
        const filter = (reaction, user) => {
            return reaction.emoji.name === config.emojis.confirm && !user.bot;
        };
        
        const collector = messageEmbed.createReactionCollector(filter, { dispose: true, time: lobbyUtils.getLobbyDuration(time) });

        collector.on('collect', async (reaction, user) => {
            let playerRankString = "";
            let usersString = "";
            try {
                if(!config.lobbies[lobby].team) {
                    if(await lobbyUtils.isRegistered(user)) {
                        let playerRank = await rankUtils.findPlayerRank(user);
                        playersRank.push(rankUtils.getRankInfo(lobby, playerRank));
                        playersRank.forEach(element => playerRankString += element.playerName + " [" + element.rank + "]\n");          
                    
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
                }
                else {
                    playerRankString = "";
                    let team = await teamUtils.getTeamMembers(user.id);
                    if(team.modality != lobby) {
                        lobbyChannel.send("<@" + user.id + ">, your are trying to sign up a lobby modality of " + lobby + " with a team of " + team.modality + ". Not allowed.");
                    }
                    else if(team.lobbyMatch == lobbyNumber) {
                        lobbyChannel.send("<@" + user.id + ">, already signed up the lobby, you can not sign up twice.");
                        await reaction.users.remove(user.id);
                    }
                    else {
                        let teamMembers = team.discordPartnersIds;
                        let playerRank;

                        for(let memberId of teamMembers) {
                            let u = {};
                            u.id = memberId;
                            if(await lobbyUtils.isRegistered(u)) {
                                playerRank = await rankUtils.findPlayerRank(u);
                                playersRank.push(rankUtils.getRankInfo(lobby, playerRank));
                                usersAndFlags.set(u.id, (playerRank.player == undefined ? config.defaultFlag : playerRank.player.flag) + " <@" + u.id + ">\n");
                            }
                            else {
                                await reaction.users.remove(user.id);
                                let answer = "before to sign up the lobby the user <@" + memberId + "> must set the player name, use !set_player_name or !spn.\n\n" + 
                                    "Example:\n!set_player_name <your player name>\n!spn <your player name>";
                                lobbyChannel.send("<@" + user.id + ">, " + answer);
                                return;
                            }
                        }

                        playersRank.forEach(element => playerRankString += element.playerName + " [" + element.rank + "]\n");    
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
                            await reaction.users.remove(u.id);
                            lobbyChannel.send("<@" + u.id + ">, the lobby is full by the moment. Stay focus just in case there is a vacancy in the near future");
                        } 
                        
                        await TeamSchema.findOneAndUpdate({ 
                            discordPartnersIds: message.author.id,
                            lobbyMatch: null
                        }, { lobbyMatch: lobbyNumber }).exec();
                    }
                }
            } catch(err) { console.log(err); }
        });

        collector.on('remove', async (reaction, user) => {  
            let playerRankString = "";
            let usersString = "";
            if(!config.lobbies[lobby].team) {
                if(await lobbyUtils.isRegistered(user)) {
                    lobbyCompleted = false;
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
                                .addField("\nIDs & Ranks", "```" + playerRankString + "```", true)
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
            }
            else {
                let team = await teamUtils.getTeamMembers(user.id);
                let teamMembers = team.discordPartnersIds;
                let playerRank;
                for(let memberId of teamMembers) {
                    let u = {};
                    u.id = memberId;
                
                    usersAndFlags.delete(u.id);
                    playerRank = await rankUtils.findPlayerRank(u);
                    playerRank = rankUtils.getRankInfo(lobby, playerRank);
                    playersRank = playersRank.filter(item => item.id !== playerRank.id);  
                }

                usersAndFlags.forEach(element => usersString += element);
                playersRank.forEach(element => playerRankString += element.playerName + " [" + element.rank + "]\n");    
                averageRank = rankUtils.calculateAverageRank(playersRank);

                lobbyCompleted = false;

                const newEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(title);

                if(usersString != "") {
                    newEmbed.addField("\nPlayers", usersString, true)
                        .addField("\nIDs & Ranks", "```" + playerRankString + "```", true)
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

                await TeamSchema.findOneAndUpdate({ 
                    discordPartnersIds: message.author.id,
                    lobbyMatch: lobbyNumber
                }, { lobbyMatch: null }).exec();
            }
        });

        collector.on('end', async (reaction, user) => {
            let messagesArray = [messageEmbed, rankedMessage];
            if(Array.from(usersAndFlags.keys()).length >= minPlayersPerLobby) {
                lobbyUtils.finishLobby(messagesArray, deleteMessageInHours, futureTask, lobbyChannel, Array.from(usersAndFlags.keys()), tracks, lobby, averageRank, lobbyNumber);
            }
            else {
                messagesArray.forEach(element => { element.delete(); });
            }

            if(!config.lobbies[lobby].team) {
                // eliminar todos los equipos para liberarlos por si quieren planificar otras futuras rankeds
            }
        });
    }

}