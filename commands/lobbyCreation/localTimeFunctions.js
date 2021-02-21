const config = require('@config');

exports.isCorrectTime = function(time) {

    let format = config.hourFormat.horaMinutoUS;
    let correctTime = time.search("((1[0-2]|0?[0-9]):([0-5][0-9]) ?([AaPp][Mm]))") == 0 ? true : false;

    if(!correctTime) {
        correctTime = time.search("((1[0-2]|0?[0-9]) ?([AaPp][Mm]))") == 0 ? true : false;
        format = config.hourFormat.horaUS;
    }
    if(!correctTime) { 
        correctTime = time.search("(0[0-9]|1[0-9]|2[0-3]|[0-9])") == 0 ? true : false;
        format = config.hourFormat.horaEU;
    }
    if(time.includes == "0:")
        correctTime = false;

    return {correctTime, format};
  }

  exports.getFormatedTimeZones = function(time, emojiTimeZone, format) {
    
    let hours = time.split(":")[0];
    hours = hours.split(" ")[0];
    let minutes = 0;
    
    if(format == config.hourFormat.horaMinutoUS || format == config.hourFormat.horaUS) {
        hours = parseInt(hours) + (time.indexOf("pm") != -1 ? parseInt(12) : parseInt(0));
        
        if(format == config.hourFormat.horaMinutoUS) {
            minutes = time.split(":")[1];
            minutes = minutes.split(" ")[0];
        }
    }

    time = new Date();
    let formatedTime = "";
    let chosenTimeZone = config.timeZones.find(timeZone => timeZone.emoji == emojiTimeZone);
    time.setHours(hours - chosenTimeZone.UTCZone.replace("UTC", "") + parseInt(config.localTimeZone.UTCDifference));
    time.setMinutes(minutes);

    for(const timeZoneObject of config.timeZones) {
        let timeLocaled = time.toLocaleTimeString("en-US", {timeZone: timeZoneObject.timeZone});
        if(minutes == 0) 
            timeLocaled = timeLocaled.split(":")[0] + " " + timeLocaled.split(" ")[1].toLowerCase();
        else
            timeLocaled = timeLocaled.split(":")[0] + ":" + timeLocaled.split(":")[1] + " " + timeLocaled.split(" ")[1].toLowerCase();

        formatedTime += timeLocaled + " " + timeZoneObject.name + "\n";
    }
    
    return formatedTime;
  }