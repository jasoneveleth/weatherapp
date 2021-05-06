function requestlocation() {
  if (navigator.geolocation) {
    // navigator.geolocation.getCurrentPosition(initSkyGraph)
      console.log("got location")
  } else { 
    alert("Geolocation is not supported by this browser.")
  }
}

document.addEventListener("DOMContentLoaded", requestlocation);

// url = 'https://api.weather.gov/points/42,-73'
const url = 'https://api.weather.gov/gridpoints/BOX/8,49'
const iso8601dateregex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+(\d{2}:\d{2})\/PT(\d)H/
// year, month, day, hour, min, sec, offset (truncated down), interval (truncated to hours)
// 1       2     3     4     5   6      7                       8

function formatdate(str) {
    const date = str.match(iso8601dateregex)
    return date[3] + " " + ((Number(date[4]) + 20) % 24).toString() + ":00" // subtract 4 to get ny time
}

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
