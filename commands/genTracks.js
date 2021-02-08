module.exports = {
    name: "genTracks",
    description: "generates random tracks",
    execute(message, args, Discord, client){

        var pistas = [{race:"Cala Crash | Crash Cove", banned:false, used:false, blue:false},
					  {race:"Cuevas Misteriosas | Mystery Caves", banned:false, used:false, blue:false},
					  {race:"Pista Cloaca | Sewer Speedway", banned:false, used:false, blue:false},
					  {race:"Tubos de Roo | Roo's Tubes", banned:false, used:false, blue:false},
					  {race:"Coliseo Derrape | Slide Coliseum", banned:false, used:false, blue:false},
					  {race:"Pista Turbo | Turbo Track", banned:false, used:false, blue:true},
					  {race:"Parque Coco | Coco Park", banned:false, used:false, blue:false},
					  {race:"Templo Tigre | Tiger Temple", banned:false, used:false, blue:false},
					  {race:"Pirámide Papu | Papu's Pyramid", banned:false, used:false, blue:false},
					  {race:"Cañón Dingo | Dingo Canyon", banned:false, used:false, blue:false},
					  {race:"Paso Polar | Polar Pass", banned:false, used:false, blue:true},
					  {race:"Circuito Tiny | Tiny Arena", banned:false, used:false, blue:false},
					  {race:"Minas Dragón | Dragon Mines", banned:false, used:false, blue:false},
					  {race:"Risco Nevado - Ráfaga Bluff | Blizzard Bluff", banned:false, used:false, blue:false},
					  {race:"Ruta Calurosa | Hot Air Skyway", banned:false, used:false, blue:true},
					  {race:"Castillo Cortex | Cortex Castle", banned:false, used:false, blue:true},
					  {race:"Laboratorios N.Gin | N. Gin Labs", banned:false, used:false, blue:true},
					  {race:"Estación Oxide | Oxide Station", banned:false, used:false, blue:true},
					  {race:"Isla Infierno | Inferno Island", banned:false, used:false, blue:false},
					  {race:"En la Selva | Jungle Boogie", banned:false, used:false, blue:false},
					  {race:"Reloj Wumpa - Wumpa Mecánica | Clockwork Wumpa", banned:false, used:false, blue:true},
					  {race:"Barrio Androide - Zona Androide | Android Alley", banned:false, used:false, blue:false},
					  {race:"Avenida Electrón | Electron Avenue", banned:false, used:false, blue:true},
					  {race:"Ruta Submarina - Carreras Submarinas | Deep Sea Driving ", banned:false, used:false, blue:true},
					  {race:"País del Trueno | Thunder Struck", banned:false, used:false, blue:true},
					  {race:"Templo de Tiny | Tiny Temple", banned:false, used:false, blue:true},
					  {race:"Valle Meteorito | Meteor Gorge", banned:false, used:false, blue:false},
					  {race:"Ruinas Barin | Barin Ruins", banned:false, used:false, blue:false},
					  {race:"Fuera del Tiempo | Out of Time", banned:false, used:false, blue:true},
					  {race:"Cadena de Montaje - La Fábrica | Assembly Lane", banned:false, used:false, blue:false},
					  {race:"Autopista Espacial | Hyper Spaceway", banned:true, used:false, blue:true},
					  {race:"Circuito Crepúsculo | Twilight Tour", banned:false, used:false, blue:true},
					  {race:"Parque Prehistórico | Prehistoric Playground", banned:false, used:false, blue:true},
					  {race:"Circuito de Spyro | Spyro Circuit", banned:true, used:false, blue:false},
					  {race:"Pesadilla de Nina | Nina NightMare", banned:false, used:false, blue:true},
					  {race:"Circo Koala | Koala Karnival", banned:false, used:false, blue:true},
					  {race:"Jengibre Vertiginoso | Gingerbread Joyride", banned:false, used:false, blue:true},
					  {race:"Megamix Manía | Megamix Mania", banned:false, used:false, blue:true},
					  {race:"Peligro para Llevar | Driver Thru Danger", banned:false, used:false, blue:true}];

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
            
		    if(pistas[random].used || (pistas[random].banned && !includeBannedTracks))
		    	i--;
		    else {
		    	if(pistas[random].blue && numBlueRaces < media)
		    		numBlueRaces++;
		    	else if(!pistas[random].blue && numSacredRaces < media)
		    		numSacredRaces++;
		    	else {
		    		i--;
		    		continue;
		    	}

		    	pistas[random].used = true;
		    	round.push(pistas[random].race.split(" | ")[1]);
			}
		}

        return round;
    }
}