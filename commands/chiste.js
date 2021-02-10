module.exports = {
    name: "chiste",
    description: "this is just a joke in Spanish",
    guildOnly: true,
    public: true,
    execute(message, args, Discord, client){
        message.channel.send("Que le dice un poyo polocia a otro?\nNecesitamos apoyo");
    }
}