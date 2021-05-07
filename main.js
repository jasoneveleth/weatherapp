function loadChart(url) {
    console.log(url)
    fetch(url)
        .then(res => res.json())
        .then((obj) => {
            const weather = obj.properties

            function extractPoint(acc, val) {
                const iso8601 = val.validTime.match(/^[-0-9T:+]+/)[0]
                const date = new Date(iso8601)
                return acc.concat([{x: date.valueOf(), y: val.value}])
            }

            const skyCover = weather.skyCover.values.reduce(extractPoint, [])
            const precip = weather.probabilityOfPrecipitation.values.reduce(extractPoint, [])
            const startTime = Date.now()
            const endTime = Date.now() + (24 * 60 * 60 * 1000 * 2)

            // color for canvas background
            const plugin = {
                id: 'custom_canvas_background_color',
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext('2d');
                    const chartArea = chart.chartArea

                    const chartWidth = chartArea.right - chartArea.left
                    const sunset = 1620432000000
                    const sunrise = 1620468000000
                    const grayStart = chartArea.left + chartWidth * (sunset - startTime) / (endTime - startTime)
                    const grayEnd = chartArea.left + chartWidth * (sunrise - startTime) / (endTime - startTime)

                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'lightGray';
                    ctx.fillRect(grayStart, chartArea.top, grayEnd - grayStart, chartArea.bottom - chartArea.top);
                    // ctx.fillStyle = 'blue';
                    // ctx.fillRect(0, chartArea.top, chart.width, chartArea.bottom - chartArea.top);
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
                        parse: false,
                    }, {
                        label: 'Precipitation',
                        backgroundColor: 'rgb(97, 175, 239)',
                        borderColor: 'rgb(97, 175, 239)',
                        data: precip,
                        parse: false,
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
                            min: startTime,
                            max: endTime,
                        },
                        y: {
                            title: {
                                text: "% of sky cover/% chance of rain",
                                display: true,
                            },
                            ticks: {
                                callback: (value, index, values) => (value + '%')
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

fetch("https://api.ipify.org?format=json")
    .then(res => res.json())
    .then(obj => fetch("http://ip-api.com/json/" + obj.ip.toString()))
    .then(res => res.json())
    .then(obj => 'https://api.weather.gov/points/' + obj.lat.toFixed(5) + ',' + obj.lon.toFixed(5))
    .then(url => fetch(url))
    .then(res => res.json())
    .then(obj => obj.properties.forecastGridData)
    .then(url => loadChart(url))
    .catch(err => {
        alert("Defaulting to Albany NY")
        loadChart("https://api.weather.gov/gridpoints/BOX/8,49")
    })
