const config = require('@config');

module.exports = {
	name: 'suggestion',
	description: 'Suggest a new bot feature',
    guildOnly: true,
    public: true,
    aliases: ["suggest", "sugerencia"],
    example: "!suggestion text",
    permissions: false,
	execute(message, args, Discord, client, cmd) {
        const channel = message.guild.channels.cache.find(ch => ch.name == config.suggestionChannel);
        if(!channel) return message.channel.send("suggestions channel does not exist!");

        let messageArgs = args.join(" ");
        const embed = new Discord.MessageEmbed()
            .setColor("RANDOM")
            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic:true}))
            .setDescription(messageArgs);

        channel.send(embed).then((msg) => {
            msg.react(config.emojis.yes);
            msg.react(config.emojis.no);
        }).catch ((error) => {
            console.log(error);
        })
    },
};
