const config = require('../config/config.json');

module.exports = {
    name: "genTracks",
    description: "generates random tracks",
    execute(){
		var numRaces = 8;
		var includeBannedTracks = false;
		var numBlueRaces = 0;
		var numSacredRaces = 0;
		var min = 1; 
		var max = 39;  
		var media = Math.round(numRaces / 2);
		var round = [];

		for(var i = 0; i < numRaces; i++) {
		    var random = Math.floor(Math.random() * (max + 1 - min)) + min - 1; 
            
		    if(config.tracks[random].used || (config.tracks[random].banned && !includeBannedTracks))
		    	i--;
		    else {
		    	if(config.tracks[random].blue && numBlueRaces < media)
		    		numBlueRaces++;
		    	else if(!config.tracks[random].blue && numSacredRaces < media)
		    		numSacredRaces++;
		    	else {
		    		i--;
		    		continue;
		    	}

		    	config.tracks[random].used = true;
		    	round.push(config.tracks[random].race.split(" | ")[1]);
			}
		}

        return round;
    }
}