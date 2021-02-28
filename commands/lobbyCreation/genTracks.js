require("module-alias/register");

const config = require('@config');
const lobbyUtils = require('@utils/lobbyUtils.js');

module.exports = {
    name: "gentracks",
    description: "generates random tracks",
	guildOnly: true,
	public: true,
    execute(message, args, Discord, client){
		if(!args.length) {
			message.channel.send(lobbyUtils.genTracks(8));
			return;
		}

		if(isNaN(args[0])) return message.reply("you must chose a number");
		if(args[0] < 1) return message.reply("you must choose at least 1 track to generate");
		message.channel.send(lobbyUtils.genTracks(parseInt(args[0])));
    }
}