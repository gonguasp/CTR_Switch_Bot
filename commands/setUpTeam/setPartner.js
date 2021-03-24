require("module-alias/register");

const teamUtils = require('@utils/teamUtils.js');
const config = require('@config');

module.exports = {
    name: "set_partner",
    description: "set the compostion of the team",
    aliases: ["sp", "marry"],
    args: true,
    usage: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client)  {
        if(args.includes("<@" + message.author.id + ">")) {
            message.reply("you can not add yourself to the team twice.");
            return;
        }

        if(args.length > 3) {
            message.reply("you can not create a team with more than 4 members.");
            return;
        }

        const embed = new Discord.MessageEmbed()
            .setColor("RANDOM")
            .addField("Team creation", args.join(", ") + " react with " + config.emojis.confirm + " to set your team with <@" + message.author.id + ">", true);

        let messageEmbed = await message.channel.send(embed);
        await messageEmbed.react(config.emojis.confirm);
        
        const filter = (reaction, user) => {
            return reaction.emoji.name === config.emojis.confirm && !user.bot && (args.includes("<@" + user.id + ">") || args.includes("<@!" + user.id + ">"));
        };

        await messageEmbed.awaitReactions(filter, { 
            max: args.length, min: args.length, time: 60000 }).then(async (collected) => {
                let collector = collected.get(config.emojis.confirm);

                if(collector.users != undefined) {
                    let membersId = Array.from(collector.users.cache.keys());
                    membersId.shift();
                    if (await teamUtils.createTeam(message, membersId)) {
                        const newEmbed = new Discord.MessageEmbed()
                            .setColor("RANDOM")
                            .addField("Team creation", "The players " + args.join(", ") + " and <@" + message.author.id+ "> are forming team now.", true);

                        messageEmbed.edit(newEmbed);
                    }
                }
                else {
                    message.reply("Operation canceled: Timeout");        
                }
        }).catch(() => {
            message.reply("Operation canceled: Timeout");
        });     
    }
}