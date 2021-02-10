require("module-alias/register");

const config = require('@config');

exports.isCorrectEmoji = function(emoji) {
    
    let correctEmoji = false;

    Object.values(config.timeZones).forEach(timeZone => {
        if(config.timeZonesData[timeZone].emoji == emoji)
            correctEmoji = true;
    });

    return correctEmoji;
}