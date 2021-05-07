function loadChart(url) {
    console.log(url)
    fetch(url)
        .then(res => res.json())
        .then((obj) => {
            function extractPoint(acc, val) {
                const iso8601 = val.validTime.match(/^[-0-9T:+]+/)[0]
                const date = new Date(iso8601)
                return acc.concat([{x: date.valueOf(), y: val.value}])
            }

            const weather = obj.properties

            const skyCover = weather.skyCover.values.reduce(extractPoint, [])
            const precip = weather.probabilityOfPrecipitation.values.reduce(extractPoint, [])

            // color for canvas background
            const plugin = {
                id: 'custom_canvas_background_color',
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext('2d');
                    const chartArea = chart.chartArea

                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'lightGray';
                    ctx.fillRect(chartArea.left, chartArea.top, chart.width/2, chartArea.bottom - chartArea.top);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, chartArea.top, chart.width, chartArea.bottom - chartArea.top);
                    ctx.restore();
                }
            };

            const config = {
                type: 'line',
                data: { 
                    datasets: [{
                        label: 'Sky cover',
                        backgroundColor: 'rgb(117, 117, 117)',
                        borderColor: 'rgb(117, 117, 117)',
                        data: skyCover,
                    }, {
                        label: 'Precipitation',
                        backgroundColor: 'rgb(97, 175, 239)',
                        borderColor: 'rgb(97, 175, 239)',
                        data: precip,
                    }] 
                },
                plugins: [plugin],
                options: {
                    interaction: {
                        mode: 'x',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            // https://stackoverflow.com/questions/67322201/chart-js-v3-x-time-series-on-x-axis/67405387#67405387
                            type: "time",  // <-- "time" instead of "timeseries"
                            min: Date.now(),
                            max: Date.now() + (24 * 60 * 60 * 1000 * 4),
                        },
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
            var myChart = new Chart(document.getElementById('myChart'), config);
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
