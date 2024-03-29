const config = require('@config');
const utils = require('@utils/utils.js');

module.exports = {
	name: 'ban',
	description: 'Ban a user for an ammount of days',
    aliases: "banear",
    guildOnly: true,
    public: true,
    example: "!ban @user numDays reason",
    permissions: true,
	async execute(message, args, Discord, client) {
        if(args.length <= 3) { message.reply("not valid arguments."); return; }
        let originalUser = args.shift();
        let user = originalUser.replace("<@", "").replace("!", "").replace(">", "");
        let days = args.shift();
        let reason = args.join(" ");

        try {
            await utils.setBan(user, days, reason);
        } catch (err) {
            console.log(err);
        }

        message.reply(originalUser + " has been banned for " + days + " days becuase " + reason);
    }
};