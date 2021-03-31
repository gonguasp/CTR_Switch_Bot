const config = require('@config');
const RankSchema = require('@models/RankSchema.js');
const Discord = require("discord.js");

module.exports = {
    name: "scores",
    description: "ask for the scores or show the scores points for the lobbies",
    aliases: ["scores?"],
    guildOnly: true,
    public: true,
    example: "!scores\n!scores?\n!scores ?",
    permissions: false,
    async execute(message, args, Discord, client) {
        if(message.content.includes("?") || args[0] == "?") {
            message.channel.send({files: [config.scoreImagesDir + "scores_question.png"]});
        }
        else {
            message.channel.send({files: [config.scoreImagesDir + "scores.png"]});
        }
    }
}