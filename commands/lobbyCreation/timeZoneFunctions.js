const config = require('../../config/config.json');

exports.isCorrectEmoji = function(emoji) {
    
    let correctEmoji = false;

    Object.values(config.timeZones).forEach(timeZone => {
        if(config.timeZonesData[timeZone].emoji == emoji)
            correctEmoji = true;
    });

    return correctEmoji;
}