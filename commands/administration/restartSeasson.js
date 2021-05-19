const config = require('@config');
const rankUtils = require('@utils/rankUtils.js');

module.exports = {
	name: 'restart_seasson',
	description: 'sets all ranked data to initial data',
    aliases: "rs",
    guildOnly: true,
    public: true,
    example: "restart_seasson duos",
    permissions: true,
	async execute(message, args, Discord, client) {
        if(args.length != 1) { message.reply("not valid arguments."); return; }
        let modality = args.shift();
        
        try {
            await rankUtils.restartSeasson(message, modality);
        } catch (err) {
            console.log(err);
        }

        message.reply("seasson of " + modality + " restarted successfully");
    }
};