const config = require('@config');
const RankSchema = require('@models/RankSchema.js');

module.exports = {
    name: "rank",
    description: "",
    guildOnly: true,
    public: true,
    async execute(message, args, Discord, client) {
        console.log(await RankSchema.find({}));
        
    }
}