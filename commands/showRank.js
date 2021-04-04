const RankSchema = require('@models/RankSchema.js');
const Discord = require("discord.js");
const rankUtils = require('@utils/rankUtils.js');

module.exports = {
    name: "rank",
    description: "shows your rank",
    guildOnly: true,
    public: true,
    example: "!rank",
    permissions: false,
    async execute(message, args, Discord, client) {

        let rank = (await RankSchema.find({ discordId: message.author.id }))[0];
        const embed = new Discord.MessageEmbed();

        if(parseInt(rank.ffaPlayed) != 0) {
            let rankPosition = (await RankSchema.find({ ffa: { $gt: rank.ffa }, ffaPlayed: { $ne: 0 }})).length + 1;
            embed.addField("FFA", "#" + rankPosition + " - " + rank.ffa, true)
        }

        if(parseInt(rank.duosPlayed) != 0) {
            let rankPosition = (await RankSchema.find({ duos: { $gt: rank.duos }, duosPlayed: { $ne: 0 }})).length + 1;
            embed.addField("Duos", parseInt(rank.duosPlayed) != 0 ? rank.duos : "-", true)
        }

        if(parseInt(rank.war3vs3Played) != 0) {
            let rankPosition = (await RankSchema.find({ war3vs3Played: { $gt: rank.war3vs3Played }, war3vs3PlayedPlayed: { $ne: 0 }})).length + 1;
            embed.addField("3 vs 3", parseInt(rank.war3vs3Played) != 0 ? rank.war3vs3 : "-", true)
        }

        if(parseInt(rank.war4vs4Played) != 0) {
            let rankPosition = (await RankSchema.find({ war4vs4: { $gt: rank.war4vs4 }, war4vs4Played: { $ne: 0 }})).length + 1;
            embed.addField("4 vs 4", parseInt(rank.war4vs4Played) != 0 ? rank.war4vs4 : "-", true)
        }

        if(parseInt(rank.itemlessPlayed) != 0) {
            let rankPosition = (await RankSchema.find({ itemless: { $gt: rank.itemless }, itemlessPlayed: { $ne: 0 }})).length + 1;
            embed.addField("Itemless", parseInt(rank.itemlessPlayed) != 0 ? rank.itemless : "-", true);
        }

        embed.setColor("RANDOM");
        embed.setTitle(rank.playerName + "'s rank");

        message.channel.send(embed);
    }
}