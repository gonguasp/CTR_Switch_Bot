require("module-alias/register");

const teamUtils = require('@utils/teamUtils.js');
const config = require('@config');

module.exports = {
    name: "unset_partner",
    description: "disolve your team",
    aliases: ["up", "divorce"],
    args: true,
    usage: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client)  {
        if(!(await teamUtils.checkTeamMembersFree( [ message.author.id ] )).free) {
            await teamUtils.deleteTeam(message);
            message.reply("you are not longer part of any team in this moment.");
        }
        else {
            message.reply("you are not part of any team in this moment.");
        }
    }
}