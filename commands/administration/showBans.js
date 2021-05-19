const config = require('@config');
const utils = require('@utils/utils.js');

module.exports = {
	name: 'show_ban',
	description: 'show the current bans',
    aliases: ["baneos", "baneados"],
    guildOnly: true,
    public: true,
    example: "!show_bans",
    permissions: false,
	async execute(message, args, Discord, client, filter) {
        let bans = await utils.showBans(filter);
        
        message.reply("\n" + JSON.stringify(bans, null, '\t\t').replaceAll("\"", ""));
    }
};