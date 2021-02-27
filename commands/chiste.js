const config = require('@config');
const utils = require('@utils/utils.js');

module.exports = {
    name: "chiste",
    description: "this is just a joke in Spanish",
    guildOnly: true,
    public: true,
    execute(message, args, Discord, client) {
        
        if(utils.areAllUsed(config.chistes))
            utils.restartUsability();

        let random = Math.round(Math.random() * (config.chistes.length - 1));
        while(config.chistes[random].used)
            random = Math.round(Math.random() * (config.chistes.length - 1));

        config.chistes[random].used = true;
        message.channel.send(config.chistes[random].text);
    }
}