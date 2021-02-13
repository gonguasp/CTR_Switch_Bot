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

    console.log({correctTime, format});
    return {correctTime, format};
  }

  exports.getFormatedTimeZones = function(time, emojiTimeZone, format) {
    
    /*const timeZoneMexico = "1️⃣";
    const timeZoneNewYork = "2️⃣";
    const timeZoneMadrid = "3️⃣";*/
    let timeMexico = "";
    let timeNewYork = "";
    let timeMadrid = "";
    
    //let hours = parseInt(time.substring(0, 2));
    /*let hours = time.split(":")[0];
    hours = hours.split(" ")[0];
    let minutes = time.split(":")[1];
    minutes = minutes.split(" ")[0];*/


    /*for(const timeZone of config.timeZonesData) {
        if(emojiTimeZone == timeZone) {

        }
    }*/

    /*switch(timeZone) {
        case timeZoneMexico:
            timeMexico = time;
            timeNewYork = ((hours + 1) % 12) + time.substring(2, time.length);
            timeMadrid = ((hours + 7) % 12) + time.substring(2, time.length);
            break;
        case timeZoneNewYork:
            timeMexico = ((hours - 1) % 12) + time.substring(2, time.length);
            timeNewYork = time;
            timeMadrid = ((hours + 7) % 12) + time.substring(2, time.length);
            break;
        case timeZoneMadrid:
            timeMexico = ((hours - 7) % 12) + time.substring(2, time.length);
            timeNewYork = ((hours - 6) % 12) + time.substring(2, time.length);
            timeMadrid = time;
            break;
    }*/

    let formatedTime = "not implemented yet";//timeMexico + " Mexico\n" + timeNewYork + " New York\n" + timeMadrid + " Madrid\n";
    console.log(formatedTime);
    return formatedTime;
  }