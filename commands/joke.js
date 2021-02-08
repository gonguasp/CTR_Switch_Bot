module.exports = {
    name: "joke",
    description: "this is just a joke",
    execute(message, args, Discord, client){
        message.channel.send("Hear about the new restaurant called Karma?\nThere's no menu: You get what you deserve."); 
    }
}