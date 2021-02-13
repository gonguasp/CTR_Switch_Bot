const config = require('@config');
const utils = require('@utils/utils.js');

module.exports = {
    name: "joke",
    description: "this is just a joke",
    guildOnly: true,
    public: true,
    execute(message, args, Discord, client) {

        if(message.content != "joke") {
            if(utils.areAllUsed(config.jokes))
                utils.restartUsability();

            let random = Math.round(Math.random() * (config.jokes.length - 1));
            while(config.jokes[random].used)
                random = Math.round(Math.random() * (config.jokes.length - 1));

            message.channel.send(config.jokes[random].text);
        }
    }
}