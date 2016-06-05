
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var ehrIdArray = ["", "", ""];
var myBarChart;
var map;
var infowindow;
var pos = {lat: 46.05, lng: 14.5}; //default position is Ljubljana
var markers = [];


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 */
function generirajPodatke(stPacienta) {
  
  if (stPacienta == 1) {
  	
  	kreirajEHRzaBolnika(0, "Janez", "Hadžipašić", "1107-10-30T00:00:00.000Z", "MALE");
  	
  	setTimeout(function() {
    	dodajMeritveVitalnihZnakov(ehrIdArray[0], "1991-11-21T11:40Z", "180", "70.0", "36.50,", "111", "88", "100", "Franja NMK");
	}, 1000);
  }
  
  else if (stPacienta == 2) {
  	
  	kreirajEHRzaBolnika(1, "Bruhilda", "Novak", "911-10-30T00:00:00.000Z", "FEMALE");
  	
  	setTimeout(function() {
    	dodajMeritveVitalnihZnakov(ehrIdArray[1], "1996-11-21T11:40Z", "170", "58.0", "36.44,", "100", "80", "100", "Franja NMK");
	}, 1000);
  }
  
  else if (stPacienta == 3) {
  	
  	kreirajEHRzaBolnika(2, "Jason", "Genova", "1337-10-30T00:00:00.000Z", "MALE");
  	
  	setTimeout(function() {
    	dodajMeritveVitalnihZnakov(ehrIdArray[2], "1985-11-21T11:40Z", "165", "110.0", "38.10,", "140", "110", "50", "Franja NMK");
	}, 1000);
  }
}

function uspesnoGeneriranje() {
	
	setTimeout(function() {
    	$("#uspesnoGeneriranje").html("<span class='obvestilo " +
                          "label label-success fade-in'>EHR zapisi uspešno kreirani! Dostopni so v izbirnem menuju.</span>");
	}, 500);
}

/**
 * Kreiraj nov EHR zapis za pacienta in dodaj osnovne demografske podatke.
 * V primeru uspešne akcije izpiši sporočilo s pridobljenim EHR ID, sicer
 * izpiši napako.
 */
function kreirajEHRzaBolnika(pacient, ime, priimek, datumRojstva, spol) {
	sessionId = getSessionId();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#uspesnoGeneriranje").html("<span class='obvestilo label " +
      "label-warning fade-in'>Napaka pri generiranju!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        ehrIdArray[pacient] = ehrId;
		        if (pacient == 0) {
		        	
		        	$("#EHRID1").val(ehrIdArray[pacient]);
		        }
		        else if (pacient == 1) {
		        	
		        	$("#EHRID2").val(ehrIdArray[pacient]);
		        }
		        else if (pacient == 2) {
		        	
		        	$("#EHRID3").val(ehrIdArray[pacient]);
		        }
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            gender: spol,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		            },
		            error: function(err) {
		            	$("#uspesnoGeneriranje").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}

/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov(ehrId, datumInUra, telesnaVisina, telesnaTeza, telesnaTemperatura, sistolicniKrvniTlak, diastolicniKrvniTlak, nasicenostKrviSKisikom, merilec) {
	sessionId = getSessionId();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#uspesnoGeneriranje").html("<span class='obvestilo " +
      "label label-warning fade-in'>Napaka pri generiranju!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    },
		    error: function(err) {
		    	$("#uspesnoGeneriranje").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}


/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite EHR ID!");
	} else {
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        $("#dodajVitalnoTelesnaTemperatura").val(res[0].temperature);
					    	} else {
					    		$("#preberiSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        $("#dodajVitalnoTelesnaTeza").val(res[0].weight);
					    	} else {
					    		$("#preberiSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "height",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        $("#dodajVitalnoTelesnaVisina").val(res[0].height);
					    	} else {
					    		$("#preberiSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        $("#dodajVitalnoKrvniTlakSistolicni").val(res[0].systolic);
						        $("#dodajVitalnoKrvniTlakDiastolicni").val(res[0].diastolic);
					    	} else {
					    		$("#preberiSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "spO2",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        $("#dodajVitalnoNasicenostKrviSKisikom").val(res[0].spO2);
					    	} else {
					    		$("#preberiSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#imePriimek").html("<span><b>" + party.firstNames + " " + party.lastNames + "</b></span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
		$("#podrobnosti").html("<button type='button' class='btn btn-primary btn-xs' onclick='podrobnostiPorocila()'>podrobnosti pacienta</button><span id='zeit'></span><span id='seka'></span>");
	}
}

function podrobnostiPorocila() {
	
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#zeit").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite EHR ID!");
	} else {
					
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				var spol = party.gender;
				if (spol == "MALE") {
					spol = "moški";
				}
				else if (spol == "FEMALE") {
					spol = "ženski";
				}
				$("#zeit").html("<span class='obvestilo label " +
          "label-success fade-in'>Ime: " + party.firstNames + " " +
          party.lastNames + ", Datum rojstva: " + party.dateOfBirth + " Spol: " + spol + 
          "</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}

function fattyGraph() {
	
	if (myBarChart) {
		
		myBarChart.destroy();
	}
	
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();
	var weight;
	var height;

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo2").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite EHR ID!");
	} else {
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        weight = res[0].weight;
					    	} else {
					    		$("#preberiSporocilo2").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo2").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "height",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						        height = res[0].height;
					    	} else {
					    		$("#preberiSporocilo2").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiSporocilo2").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
		setTimeout(function() {
var healthyWeight = 50;
for (var i = 60; i < height*0.3937; i++) {
	
	healthyWeight += 1.8;
}
healthyWeight = Math.round(healthyWeight * 100)/100;

if (weight - healthyWeight < 10) {
	
	$("#fattyReport").html("Pacient ima primerno telesno težo.");
	$("#fattyMap").html("");
	
	for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
    }
	markers = [];
}

else if (weight - healthyWeight >= 10) {
	
	fattyReport();
}

var ctx = document.getElementById("myChart");
var data = {
    labels: ["Pacientova telesna teža", "Zdrava telesna teža"],
    datasets: [
        {
        	label: "Teža v kilogramih",
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderWidth: 1,
            hoverBackgroundColor: "rgba(255,99,132,0.4)",
            hoverBorderColor: "rgba(255,99,132,1)",
            data: [weight, healthyWeight],
        }
    ]
};
myBarChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
        scales: {
                xAxes: [{
                        stacked: true
                }],
                yAxes: [{
                        stacked: true
                }]
        }
        
    }
});
	}, 500);
	}
}

function fattyReport() {
	
	$("#fattyReport").html("<span><b>Pacient ima prekomerno telesno težo</b>, na zemljevidu</span>");
	$("#fattyMap").html("<span>so prikazane ustanove za izgubo odvečne telesne teže.</span>");
	
	infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch({
          location: pos,
          radius: 4000,
          type: ['gym']
        }, callback);
}
      
      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: pos,
          zoom: 12
        });
        //var infoWindow = new google.maps.InfoWindow({map: map});
		
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            map.setCenter(pos);
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else {
          // Browser doesn't support Geolocation
          
          infoWindow.setPosition(pos);
          infoWindow.setContent(false ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
          
        }
      }
      
      function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
          }
        }
      }

      function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location
        });
        markers.push(marker);

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.setContent(place.name);
          infowindow.open(map, this);
        });
      }
      
$(document).ready(function() {
  
   //Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   //ko uporabnik izbere vrednost iz padajočega menuja
   //(npr. Janez Hadžipašić, Fikret Novak, Jason Genova)
   
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

});
