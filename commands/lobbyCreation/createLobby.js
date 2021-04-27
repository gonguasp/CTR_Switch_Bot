require("module-alias/register");
const config = require('@config');
const utils = require('@utils/utils.js');
const lobbyUtils = require('@utils/lobbyUtils.js');
const rankUtils = require('@utils/rankUtils.js');
const teamUtils = require('@utils/teamUtils.js');
const TeamSchema = require('@models/TeamSchema.js');

module.exports = {
    name: "createlobby",
    description: "creates the lobby in the right channel",
    guildOnly: true,
    public: false,
    async execute(message, lobby, Discord, client, args) {
        const numTracks = config.lobbies[lobby].numRaces;
        const time = args != "" ? args : "5 pm Mexico\n6 pm New York\n12 am Madrid\n5 am Jakarta\n";
        const title = ":bust_in_silhouette:    New ranked " + lobby + " lobby";
        const color = "#FFFFFF";
        const maxPlayersPerLobby = config.lobbies[lobby].maxPlayers;
        const minPlayersPerLobby = config.lobbies[lobby].minsPlayers;
        const notifications = [5, 30];
        const deleteMessageInHours = 2;
        const lobbyChannel = utils.getChannelByName(message, config.lobbies[lobby].channel);

        let lobbyCompleted = false;
        let futureTask = undefined;
        let role = utils.getRoleByName(message, config.lobbies[lobby].role);
        let tracks = "";
        let usersAndFlags = new Map();
        let playersRank = [];
        let queuePlayers = new Map();

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
        
        if(lobbyUtils.getLobbyDuration(time) < 0) {
            lobbyChannel.send("not a valid time! Please, check the format.");
            return;
        }

        const collector = messageEmbed.createReactionCollector(filter, { dispose: true, time: lobbyUtils.getLobbyDuration(time) });

        collector.on('collect', async (reaction, user) => {
            try {
                let banneds = [];
                if((banneds = await utils.getBanneds([user.id])).length != 0) {
                    await reaction.users.remove(user.id);
                    user.send("You are banned and cant join in this moment to a lobby:\n" + JSON.stringify(banneds, null, '\t\t').replaceAll("\"", ""));
                    return;
                }

                if(!config.lobbies[lobby].team) {
                    let aux = await lobbyUtils.addPlayerToLobby(maxPlayersPerLobby, minPlayersPerLobby, user, lobby, playersRank, usersAndFlags, messageEmbed, reaction, lobbyChannel, color, title, time, notifications, message, tracks, numTracks, futureTask);
                    playersRank = aux.playersRank;
                    usersAndFlags = aux.usersAndFlags;
                    tracks = aux.tracks;
                    futureTask = aux.futureTask;
                }
                else {
                    let validTeam = await teamUtils.validTeam(user, lobbyChannel, reaction, lobby, lobbyNumber);
                    
                    if(validTeam.valid) {    
                        let team = validTeam.team;
                        let teamMembers = team.discordPartnersIds;

                        for(let memberId of teamMembers) {
                            let u = {};
                            u.id = memberId;
                            let aux = await lobbyUtils.addPlayerToLobby(maxPlayersPerLobby, minPlayersPerLobby, u, lobby, playersRank, usersAndFlags, messageEmbed, reaction, lobbyChannel, color, title, time, notifications, message, tracks, numTracks, futureTask);
                            playersRank = aux.playersRank;
                            usersAndFlags = aux.usersAndFlags;
                            tracks = aux.tracks;
                            futureTask = aux.futureTask;
                        }

                        let aux = await lobbyUtils.editAddPlayerLobbyEmbed(maxPlayersPerLobby, minPlayersPerLobby, messageEmbed, reaction, lobbyChannel, color, title, time, lobby, notifications, user, playersRank, usersAndFlags, message, tracks, numTracks, futureTask);
                        tracks = aux.tracks;
                        futureTask = aux.futureTask;
                        await TeamSchema.findOneAndUpdate({ 
                            discordPartnersIds: message.author.id,
                            lobbyMatch: null
                        }, { lobbyMatch: lobbyNumber }).exec();
                    }
                    else {
                        queuePlayers.set(user.id, await lobbyUtils.getPlayerAndFlag(user));
                        let aux = await lobbyUtils.addPlayerToLobby(maxPlayersPerLobby, minPlayersPerLobby, user, lobby, playersRank, usersAndFlags, messageEmbed, reaction, lobbyChannel, color, title, time, notifications, message, tracks, numTracks, futureTask, queuePlayers);
                        tracks = aux.tracks;
                        futureTask = aux.futureTask;
                    }
                }
            } catch(err) { console.log(err); }
        });

        collector.on('remove', async (reaction, user) => {  
            if(!config.lobbies[lobby].team) {
                if(await lobbyUtils.isRegistered(user)) {
                    lobbyCompleted = false;

                    usersAndFlags.delete(user.id);
                    let playerRank = await rankUtils.findPlayerRank(user);
                    playerRank = rankUtils.getRankInfo(lobby, playerRank);
                    playersRank = playersRank.filter(item => item.id !== playerRank.id);  
                    
                    futureTask = await lobbyUtils.editDeletePlayerLobbyEmbed(minPlayersPerLobby, lobby, usersAndFlags, playersRank, color, title, time, tracks, futureTask, message, notifications, messageEmbed);
                }
            }
            else if(usersAndFlags.has(user.id)) { // belongs to a team
                let team = await teamUtils.getTeamMembers(user.id);
                if(team == null) { return; }

                lobbyCompleted = false;
                let teamMembers = team.discordPartnersIds;

                for(let memberId of teamMembers) {
                    let u = {};
                    u.id = memberId;
                
                    usersAndFlags.delete(u.id);
                    let playerRank = await rankUtils.findPlayerRank(u);
                    playerRank = rankUtils.getRankInfo(lobby, playerRank);
                    playersRank = playersRank.filter(item => item.id !== playerRank.id);  
                }

                futureTask = await lobbyUtils.editDeletePlayerLobbyEmbed(minPlayersPerLobby, lobby, usersAndFlags, playersRank, color, title, time, tracks, futureTask, message, notifications, messageEmbed);

                await TeamSchema.findOneAndUpdate({ 
                    discordPartnersIds: message.author.id,
                    lobbyMatch: lobbyNumber
                }, { lobbyMatch: null }).exec();
            }
            else { // the player is signed in the queue players
                queuePlayers.delete(user.id);
                futureTask = await lobbyUtils.editDeletePlayerLobbyEmbed(minPlayersPerLobby, lobby, usersAndFlags, playersRank, color, title, time, tracks, futureTask, message, notifications, messageEmbed, Array.from(queuePlayers.values()));
            }
        });

        collector.on('end', async (reaction, user) => {
            let messagesArray = [messageEmbed, rankedMessage];
            if((Array.from(usersAndFlags.keys()).length + Array.from(queuePlayers.keys()).length ) >= minPlayersPerLobby) {
                lobbyUtils.finishLobby(messagesArray, deleteMessageInHours, futureTask, lobbyChannel, Array.from(usersAndFlags.keys()), Array.from(queuePlayers.keys()), tracks, lobby, await rankUtils.calculateAverageRank(playersRank), lobbyNumber);
            }
            else {
                messagesArray.forEach(element => { element.delete(); });
            }

            if(config.lobbies[lobby].team) {
                teamUtils.deleteTeams(lobbyNumber);
            }
        });
    }

}