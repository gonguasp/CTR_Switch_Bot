const config = require('@config');

module.exports = {
	name: 'shutdown',
	description: 'Shutdown the bot',
    guildOnly: true,
    public: true,
    aliases: ["sh"],
    example: "!shutdown",
    permissions: true,
	execute(message, args, Discord, client, cmd) {
        if(message.author.id == config.ownerId) {
            message.channel.send("Shutting down...").then(() => {
                client.destroy();
            });
        }
        else {
            message.reply("you don't have permissions to execute that command");
        }
    }
};