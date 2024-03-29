const config = require('@config');
const utils = require('@utils/utils.js');
const fs = require("fs");

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
    guildOnly: true,
    public: true,
    example: "!reload command",
    permissions: true,
	execute(message, args) {

        if(!utils.userHasRoles(message, config.privilegiesRole)) {
            message.reply("you don't have the role/s " + config.privilegiesRole + " to execute that command");
            return;
        }

		if (!args.length) 
            return message.channel.send(`You didn't pass any command to reload, ${message.author}!`);
        
        const commandName = args[0].toLowerCase();
        const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) 
            return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
        
        let path = "";

        for(const dir of config.commandsDirs) {  
            let fileName = fs.readdirSync(dir).find(file => file.toLowerCase() == command.name + ".js");
            if(fs.readdirSync(dir).filter(file => file.toLowerCase() == command.name + ".js").length) {
                console.log("reloading command " + dir + fileName);
                path = (dir + fileName).replace("/commands", ".");
                break;
            }
        }

        delete require.cache[require.resolve(path)];

        try { 
            const newCommand = require(path);
            message.client.commands.set(newCommand.name, newCommand);
            message.channel.send(`Command \`${command.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
        }
    },
};