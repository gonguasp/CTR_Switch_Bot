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
        let lobbyDto = {
            numTracks: config.lobbies[lobby].numRaces,
            time: args != "" ? args : "5 pm Mexico\n6 pm New York\n12 am Madrid\n6 am Jakarta/Indonesia\n",
            title: ":bust_in_silhouette:    New ranked " + lobby + " lobby",
            color: "#FFFFFF",
            maxPlayersPerLobby: config.lobbies[lobby].maxPlayers,
            minPlayersPerLobby: config.lobbies[lobby].minsPlayers,
            notifications: [5, 30],
            deleteMessageInHours: 2,
            lobbyChannel: utils.getChannelByName(message, config.lobbies[lobby].channel),
            lobbyCompleted: false,
            futureTask: undefined,
            role: utils.getRoleByName(message, config.lobbies[lobby].role),
            tracks: "",
            usersAndFlags: new Map(),
            playersRank: [],
            queuePlayers: new Map()
        };
        
        let channel = utils.getChannelByName(message, config.rankedLobbiesChannel);
        if(!channel)
            channel = message.channel;

        const embed = new Discord.MessageEmbed()
            .setColor(lobbyDto.color)
            .setTitle(lobbyDto.title)
            .addField("Time", lobbyDto.time, true);

        let rankedMessage = await channel.send("<@&" + lobbyDto.role.id + ">");
        lobbyDto.messageEmbed = await channel.send(embed);
        await lobbyDto.messageEmbed.react(config.emojis.confirm);
        lobbyDto.lobbyNumber = await lobbyUtils.saveLobby(lobby, [], 0, 0, message.author, [lobbyDto.messageEmbed, rankedMessage]);        
        
        const filter = (reaction, user) => {
            return reaction.emoji.name === config.emojis.confirm && !user.bot;
        };
        
        if(lobbyUtils.getLobbyDuration(lobbyDto.time) < 0) {
            lobbyDto.lobbyChannel.send("not a valid time! Please, check the format.");
            return;
        }

        const collector = lobbyDto.messageEmbed.createReactionCollector(filter, { dispose: true, time: lobbyUtils.getLobbyDuration(lobbyDto.time) });

        collector.on('collect', async (reaction, user) => {
            try {
                let banneds = [];
                if((banneds = await utils.getBanneds([user.id])).length != 0) {
                    await reaction.users.remove(user.id);
                    user.send("You are banned and cant join in this moment to a lobby:\n" + JSON.stringify(banneds, null, '\t\t').replaceAll("\"", ""));
                    return;
                }

                if(!config.lobbies[lobby].team) {
                    lobbyDto = await lobbyUtils.addPlayerToLobby(lobbyDto, user, lobby, reaction, message);
                }
                else {
                    let validTeam = await teamUtils.validTeam(user, lobbyDto.lobbyChannel, reaction, lobby, lobbyDto.lobbyNumber);
                    
                    if(validTeam.valid) {    
                        let team = validTeam.team;
                        let teamMembers = team.discordPartnersIds;

                        for(let memberId of teamMembers) {
                            let u = {};
                            u.id = memberId;
                            let playerRank = await rankUtils.findPlayerRank(u);
                            lobbyDto.playersRank.push(rankUtils.getRankInfo(lobby, playerRank));
                            lobbyDto.usersAndFlags.set(u.id, (playerRank.player == undefined ? config.defaultFlag : playerRank.player.flag) + " <@" + u.id + ">\n");
                        }

                        lobbyDto = await lobbyUtils.addPlayerToLobby(lobbyDto, user, lobby, reaction, message);
                    }
                    else {
                        lobbyDto.queuePlayers.set(user.id, await lobbyUtils.getPlayerAndFlag(user));
                        lobbyDto = await lobbyUtils.addPlayerToLobby(lobbyDto, user, lobby, reaction, message);
                    }
                }
            } catch(err) { console.log(err); }
        });

        collector.on('remove', async (reaction, user) => {  
            if(!config.lobbies[lobby].team) {
                if(await lobbyUtils.isRegistered(user)) {
                    lobbyDto.lobbyCompleted = false;

                    lobbyDto.usersAndFlags.delete(user.id);
                    let playerRank = await rankUtils.findPlayerRank(user);
                    playerRank = rankUtils.getRankInfo(lobby, playerRank);
                    lobbyDto.playersRank = lobbyDto.playersRank.filter(item => item.id !== playerRank.id);  
                    
                    lobbyDto.futureTask = await lobbyUtils.editDeletePlayerLobbyEmbed(lobbyDto, lobby, message);
                }
            }
            else if(lobbyDto.usersAndFlags.has(user.id)) { // belongs to a team
                let team = await teamUtils.getTeamMembers(user.id);
                if(team == null) { return; }

                lobbyDto.lobbyCompleted = false;
                let teamMembers = team.discordPartnersIds;

                for(let memberId of teamMembers) {
                    let u = {};
                    u.id = memberId;
                
                    lobbyDto.usersAndFlags.delete(u.id);
                    let playerRank = await rankUtils.findPlayerRank(u);
                    playerRank = rankUtils.getRankInfo(lobby, playerRank);
                    lobbyDto.playersRank = lobbyDto.playersRank.filter(item => item.id !== playerRank.id);  
                }

                lobbyDto.futureTask = await lobbyUtils.editDeletePlayerLobbyEmbed(lobbyDto, lobby, message);

                await TeamSchema.findOneAndUpdate({ 
                    discordPartnersIds: message.author.id,
                    lobbyMatch: lobbyDto.lobbyNumber
                }, { lobbyMatch: null }).exec();
            }
            else { // the player is signed in the queue players
                lobbyDto.queuePlayers.delete(user.id);
                lobbyDto.futureTask = await lobbyUtils.editDeletePlayerLobbyEmbed(lobbyDto, lobby, message);
            }
        });

        collector.on('end', async (reaction, user) => {
            if(!(await MatchSchema.find({ matchNumber: lobbyDto.lobbyNumber }).exec()).closed) {
                let messagesArray = [lobbyDto.messageEmbed, rankedMessage];
                if((Array.from(lobbyDto.usersAndFlags.keys()).length + Array.from(lobbyDto.queuePlayers.keys()).length ) >= lobbyDto.minPlayersPerLobby) {
                    lobbyUtils.finishLobby(messagesArray, lobbyDto, lobby);
                }
                else {
                    messagesArray.forEach(element => { element.delete(); });
                }

                if(config.lobbies[lobby].team) {
                    teamUtils.deleteTeams(lobbyDto.lobbyNumber);
                }
            }
        });

        message.reply("lobby created successfully!");
    }

}