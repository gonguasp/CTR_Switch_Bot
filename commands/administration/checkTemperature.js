const config = require('@config');
const { exec } = require("child_process");

module.exports = {
	name: 'check_temperature',
	description: 'Checks the temperature of the cpu',
    guildOnly: true,
    public: true,
    aliases: ["ct"],
	execute(message, args, Discord, client, cmd) {
        if(message.author.id == config.ownerId) {
            exec("sensors", (error, stdout, stderr) => {
                if(error) {
                    message.channel.send(error);
                    console.log(error);
                }
                else if(stderr) {
                    message.channel.send(stderr);
                    console.log(stderr);
                }
                else
                    message.channel.send(stdout);
            })
        }
        else {
            message.reply("you don't have permissions to execute that command");
        }
    }
};