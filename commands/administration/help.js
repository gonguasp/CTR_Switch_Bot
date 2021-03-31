const { prefix } = require('@config');
const Discord = require("discord.js");

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['commands', "h"],
	usage: "[command name]",
    guildOnly: true,
    public: true,
    example: "!help",
    permissions: false,
	execute(message, args) {
		
        const data = [];
        const { commands } = message.client;

        if (!args.length) {
            const newEmbed = new Discord.MessageEmbed()
                .setColor("#FFFFFF")
                .setTitle(":information_source: Here\'s a list of all my commands:")
                .addField("Info", `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`, true);
            commands.map(command => {
                if(command.public) {
                    let commandInfo = "";
                    if(command.permissions) {
                        commandInfo += "**PERMISSIONS NEEDED**\n";
                    }
                    commandInfo += "*" + command.description + "*";
                    if(command.aliases != undefined) {
                        commandInfo += "\nAnother usages: " + command.aliases;
                    } 
                    if(command.example != undefined) {
                        commandInfo += "\`\`\`\nHow to use it:\n" + command.example + "\`\`\`";
                    } 
                    newEmbed.addField("**" + command.name + "**", commandInfo);
                }
            });

            return message.author.send(newEmbed)
                .then(() => {
                    if (message.channel.type === 'dm') return;
                    message.reply('I\'ve sent you a DM with all my commands!');
                })
                .catch(error => {
                    console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                    message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                });
        }
        else {
            const name = args[0].toLowerCase();
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

            if (!command) {
                return message.reply('that\'s not a valid command!');
            }

            data.push(`**Name:** ${command.name}`);

            if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
            if (command.description) data.push(`**Description:** ${command.description}`);
            if (command.guildOnly != undefined) data.push(`**GuildOnly:** ${command.guildOnly}`);
            if (command.public != undefined) data.push(`**Public:** ${command.public}`);

            if (command.usage) {
                if(Array.isArray(command.usage)) {
                    let usageInfo = `**Usage:** `;
                    for(const usage of command.usage) {
                        usageInfo += `${prefix}${command.name} ` + usage + ", ";
                    }

                    data.push(usageInfo.slice(0, -1));
                }
                else
                    data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
            }

            data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

            message.channel.send(data, { split: true });
        }
	}
};