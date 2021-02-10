exports.isCorrectTime = function(time) {
    
    // hh:mm am/pm
    let correctTime = time.search("((1[0-2]|0?[0-9]):([0-5][0-9]) ?([AaPp][Mm]))") == 0 ? true : false;

    if(!correctTime) // hh am/pm
        correctTime = time.search("((1[0-2]|0?[0-9]) ?([AaPp][Mm]))") == 0 ? true : false;
    if(!correctTime) // HH
        correctTime = time.search("(0[0-9]|1[0-9]|2[0-3]|[0-9])") == 0 ? true : false;
    if(time.includes == "0:")
        correctTime = false;

    return correctTime;
  }

  exports.getFormatedTimeZones = function(time, timeZone) {
    
    const timeZoneMexico = "1️⃣";
    const timeZoneNewYork = "2️⃣";
    const timeZoneMadrid = "3️⃣";
    let timeMexico = "";
    let timeNewYork = "";
    let timeMadrid = "";
    let hours = parseInt(time.substring(0, 2));

    switch(timeZone) {
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
    }

    let formatedTime = timeMexico + " Mexico\n" + timeNewYork + " New York\n" + timeMadrid + " Madrid\n";
    console.log(formatedTime);
    return formatedTime;
  }