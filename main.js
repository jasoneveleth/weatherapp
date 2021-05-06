function formatdate(str) {
    const excludeintervalregex = /^[-0-9T:+]+/
    console.log(str.match(excludeintervalregex)[0])
    console.log("new Date(\"" + str.match(excludeintervalregex)[0] + "\")")
    const date = new Date(str.match(excludeintervalregex)[0])
    return date.toString()
}

function loadChart(url) {
    console.log(url)
    fetch(url)
        .then(res => res.json())
        .then((obj) => {
            const skyCover = obj.properties.skyCover.values

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

navigator.geolocation.getCurrentPosition((position) => {
    console.log(position)
    const baseUrl = 'https://api.weather.gov/points/'
    latitude=position.coords.latitude.toFixed(5);
    longitude=position.coords.longitude.toFixed(5);
    const url = baseUrl + latitude + ',' + longitude;
    // const url = "https://api.weather.gov/gridpoints/BOX/8,49"
    fetch(url)
        .then(res => res.json())
        .then(obj => obj.properties.forecastGridData)
        .then(url => loadChart(url))
}
)

