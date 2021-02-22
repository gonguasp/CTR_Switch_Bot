const config = require('@config');
const utils = require('@utils/utils.js');

module.exports = {
	name: 'send_message',
	description: 'Sends a message to a specific channel',
    aliases: "sm",
    guildOnly: true,
    public: true,
	execute(message, args, Discord, client) {

        if(!utils.userHasRoles(message, config.privilegiesRole)) {
            message.reply("you don't have the role/s " + config.privilegiesRole + " to execute that command");
            return;
        }

        let channelReference = args[0];
        let targetChannel = utils.getChannelById(message, channelReference);
        if(targetChannel == undefined) {
            message.reply("Channel " + channelReference + " not found!");
            return;
        }

        targetChannel.send(args.join(" ").replace(channelReference, ""));
    }
};