const genTracks = require("../commands/genTracks.js");

module.exports = {
    name: "createLobby",
    description: "creates the lobby in the right channel",
    async execute(message, lobby, Discord, client, args){

        const confirmReaction = "✅";
        const channel = message.channel;//client.channels.cache.get("735444004371693568");
        const time = "5 pm Mexico\n6 pm New York\\Peru\n12 am Madrid\n";
        const footer = "React with " + confirmReaction +  " if you're interested";
        const title = ":bust_in_silhouette:    New ranked " + lobby + " lobby";
        const color = "#FFFFFF";
        var lobbyCompleted = false;

        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .addField("Time", time, true)
            .setFooter(footer);

        let messageEmbed = await channel.send(embed);
        messageEmbed.react(confirmReaction);
        let users = [];

        client.on("messageReactionAdd", async (reaction, user) => {
            if(messageEmbed.id != reaction.message.id) return;
            if(reaction.message.partial) await reaction.message.fetch();
            if(reaction.partial) await reaction.fetch();
            if(user.bot) return;
            if(!reaction.message.guild) return;
            
            let usersString = "";
            users.push(user);
            users.forEach(element => usersString += "<@" + element + ">\n");

            const newEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .addField("\nPlayers", usersString, true)
                .addField("Time", time, true)
                .setFooter(footer);

            if(reaction.message.channel == channel && users.length < 8) {
                messageEmbed.edit(newEmbed);
            }
            else if(reaction.message.channel == channel && users.length == 8) {
                lobbyCompleted = true;
                newEmbed.addField("Tracks", genTracks.execute(), true);
                messageEmbed.edit(newEmbed);
            }
            else {
                channel.send("<@" + user + "> the lobby is full by the moment. Stay focus just in case there is a vacancy in the near future");
            }
        });

        client.on("messageReactionRemove", async (reaction, user) => {
            if(messageEmbed.id != reaction.message.id) return;
            if(reaction.message.partial) await reaction.message.fetch();
            if(reaction.partial) await reaction.fetch();
            if(user.bot) return;
            if(!reaction.message.guild) return;
            
            if(reaction.message.channel == channel && !lobbyCompleted) {
                let usersString = "";
                users = users.filter(item => item !== user);
                users.forEach(element => usersString += "<@" + element + ">\n");

                const newEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(title);

                if(usersString != "")
                    newEmbed.addField("\nPlayers", usersString, true);

                newEmbed
                    .addField("Time", time, true)
                    .setFooter(footer);

                messageEmbed.edit(newEmbed);
            }
        });
    }
}