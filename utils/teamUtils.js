require("module-alias/register");

const config = require('@config');
const Discord = require("discord.js");
const TeamSchema = require('@models/TeamSchema.js');
const MatchSchema = require('@models/MatchSchema.js');


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