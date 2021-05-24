const config = require('@config');
const utils = require('@utils/utils.js');

module.exports = {
    name: "joke",
    description: "this is just a joke",
    guildOnly: true,
    public: true,
    aliases: ["chiste"],
    example: "!joke",
    permissions: false,
    execute(message, args, Discord, client) {

        let jokes;
        if(message.content == "!joke") {
            jokes = config.jokes;
        }
        else {
            jokes = config.chistes;
        }

        if(utils.areAllUsed(jokes))
            utils.restartUsability();

        let random = Math.round(Math.random() * (jokes.length - 1));
        while(jokes[random].used)
            random = Math.round(Math.random() * (jokes.length - 1));

        jokes[random].used = true;
        message.channel.send(jokes[random].text);
    }
}