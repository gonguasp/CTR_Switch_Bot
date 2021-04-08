require("module-alias/register");

const config = require('@config');
const TeamSchema = require('@models/TeamSchema.js');


exports.createTeam = async function(message, membersId) {
    membersId.push(message.author.id)
    let areFree = await this.checkTeamMembersFree(membersId);
    if(areFree.free) {
        team = await TeamSchema.create({
            discordPartnersIds: membersId,
            modality: Object.values(config.lobbies)[membersId.length - 1].value
        });
        return true;
    }
    else {
        message.reply("the member <@" + areFree.id + "> can not be part of the team. He is forming another team already.");
        return false;
    }
}

exports.checkTeamMembersFree = async function(membersId) {
    let member = {};
    member.free = true;
    for(let memberId of membersId) {
        let memberHasTeam = await TeamSchema.findOne({ 
            discordPartnersIds: memberId
        }).exec() != null;
        if(memberHasTeam) { 
            member.free = false;
            member.id = memberId;
            return member; 
        }
    }
    return member;
}

exports.deleteTeam = async function(message) {
    let inRanked = await TeamSchema.findOne({ 
        discordPartnersIds: message.author.id, 
        lobbyMatch: { $ne: null } 
    }).exec() != null;

    if(inRanked) {
        message.reply("first unsubscribe of the ranked you are in");
        return false;
    }

    await TeamSchema.findOneAndDelete({ 
        discordPartnersIds: message.author.id,
        lobbyMatch: null
    }).exec();

    return true;
}

exports.getTeamMembers = async function(memberId) {
    let memberHasTeam = await TeamSchema.findOne({ 
        discordPartnersIds: memberId
    }).exec();
    return memberHasTeam;
}

exports.deleteTeams = async function (lobbyNumber) {
    try {
        await TeamSchema.deleteMany({ lobbyMatch: lobbyNumber });
    } catch (err) {
        console.log(err);
    }
}

exports.validTeam = async function (user, lobbyChannel, reaction, lobby, lobbyNumber) {
    let result = {};
    result.valid = true;
    let team = await this.getTeamMembers(user.id);
    if(team == null) {
        result.valid = false;
    }
    else if(team.modality != lobby) {
        lobbyChannel.send("<@" + user.id + ">, your are trying to sign up a lobby modality of " + lobby + " with a team of " + team.modality + ". Not allowed.");
    }
    else if(team.lobbyMatch != null && team.lobbyMatch != lobbyNumber) {
        team.discordPartnersIds.forEach(async (id) => {
            await reaction.users.remove(id);
        });
        result.valid = false;
        lobbyChannel.send("<@" + user.id + ">, before to sign up to that lobby unsubscribe from the other you are signed in");
    }

    result.team = team;
    return result;
}