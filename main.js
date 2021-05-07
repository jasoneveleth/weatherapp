function loadChart(url) {
    console.log(url)
    fetch(url)
        .then(res => res.json())
        .then((obj) => {
            function formatdate(str) {
                const iso8601 = str.match(/^[-0-9T:]+/)[0]
                const date = new Date(iso8601)
                const day2str = { 0:"Sun", 1:"Mon", 2:"Tue", 3:"Wed", 4:"Thu", 5:"Fri", 6:"Sat" }
                return day2str[date.getDay()] + " " + date.getHours() + ":00"
            }
            function extractTime(acc, val) {
                const iso8601 = val.validTime.match(/^[-0-9T:]+/)[0] + "Z"
                return acc.concat([iso8601])
            }
            function extractPoint(acc, val) {
                const iso8601 = val.validTime.match(/^[-0-9T:]+/)[0] + "Z"
                return acc.concat([{t: iso8601, y: val.value}])
            }
            function extractValue(acc, val) {
                return acc.concat([val.value])
            }

            const weather = obj.properties

            const times = weather.skyCover.values.reduce(extractTime, [])
            const skyCover = weather.skyCover.values.reduce(extractValue, [])

            const config = {
                type: 'line',
                data: { 
                    labels: times, 
                    datasets: [{
                        label: 'Sky cover',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: skyCover,
                    }] 
                },
                options: {
                    scales: {
                        y: {
                            title: {
                                text: "% of sky cover/% chance of rain",
                                display: true,
                            },
                            ticks: {
                                // Include a percent sign in the ticks
                                callback: function(value, index, values) {
                                    return value + '%';
                                }
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            }
            var myChart = new Chart(
                document.getElementById('myChart'),
                config
            );
        })
}

navigator.geolocation.getCurrentPosition(position => {
    const baseUrl = 'https://api.weather.gov/points/'
    const latitude = position.coords.latitude.toFixed(5);
    const longitude = position.coords.longitude.toFixed(5);
    const url = baseUrl + latitude + ',' + longitude;
    fetch(url)
        .then(res => res.json())
        .then(obj => obj.properties.forecastGridData)
        .then(url => loadChart(url))
}, err => {
    alert("Using weather data from Albany NY")
    loadChart("https://api.weather.gov/gridpoints/BOX/8,49")
}
)

