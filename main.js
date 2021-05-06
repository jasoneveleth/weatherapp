function requestlocation() {
return new Promise( function(resolve, reject){
    if (navigator.geolocation) {
        resolve(navigator.geolocation.getCurrentPosition(getGridUrl));
        console.log("got location")
    } else { 
	reject("Geolocation is not supported by this browser");
        //alert("Geolocation is not supported by this browser.")
  }
  })	
}

document.addEventListener("DOMContentLoaded", requestlocation().then(loadChart));

// url = 'https://api.weather.gov/points/42,-73'
url = 'https://api.weather.gov/gridpoints/BOX/8,49'
baseUrl = 'https://api.weather.gov/points/'
function getGridUrl(position){
    latitude=position.coords.latitude.toFixed(5);
    longitude=position.coords.longitude.toFixed(5);
    baseUrl += latitude + ',' + longitude;
    console.log(baseUrl);
    fetch(baseUrl)
    .then(res => res.json())
    .then((obj) => {
        url = obj.properties.forecastGridData;
        console.log(url);
     })
}




const iso8601dateregex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+(\d{2}:\d{2})\/PT(\d)H/
// year, month, day, hour, min, sec, offset (truncated down), interval (truncated to hours)
// 1       2     3     4     5   6      7                       8

function formatdate(str) {
    const matches = str.match(iso8601dateregex)
    const date = new Date(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6], 0)
    return date.toString()
}

function loadChart(){
fetch(url)
.then(res => res.json())
.then((obj) => {
    const skyCover = obj.properties.skyCover.values
    console.log(skyCover)

    const times = skyCover.reduce((acc, val) =>  acc.concat([formatdate(val.validTime)]), [])
    const percentages = skyCover.reduce((acc, val) =>  acc.concat(val.value), [])

    const data = { 
        labels: times, 
        datasets: [{
            label: 'Sky cover',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: percentages,
        }] 
    }

    const config = {
        type: 'line',
        data,
        options: {}
    }
    var myChart = new Chart(
        document.getElementById('myChart'),
        config
    );
})
}
