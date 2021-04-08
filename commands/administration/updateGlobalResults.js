const rankUtils = require('@utils/rankUtils.js');

module.exports = {
	name: 'update_global_results',
	description: 'Force the update of the ranks global results',
    guildOnly: true,
    public: true,
    aliases: ["ugr"],
    example: "!update_global_results",
    permissions: true,
	execute(message, args, Discord, client, cmd) {
        rankUtils.updateGlobalResults(message);
    }
};