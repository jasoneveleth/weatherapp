var currentLocation;
const DAYS = 2

function loadCharts(url) {
    console.log("localURL:",url)
    console.log("currentLocation:", currentLocation)
    fetch(url)
        .then(res => res.json())
        .then((obj) => {
            const weather = obj.properties
            function faren(acc, val) {
                if (val.value === null) {
                    return acc.concat([{validTime: val.validTime, value: null}])
                } else {
                    return acc.concat([{validTime: val.validTime, value: val.value * 9 / 5 + 32}])
                }
            }
            weather.temperature.values = weather.temperature.values.reduce(faren, [])
            weather.windChill.values = weather.windChill.values.reduce(faren, [])

            function extractPoint(acc, val) {
                const iso8601 = val.validTime.match(/^[-0-9T:+]+/)[0]
                const date = new Date(iso8601)
                return acc.concat([{x: date.valueOf(), y: val.value}])
            }

            const skyCover = weather.skyCover.values.reduce(extractPoint, [])
            const precip = weather.probabilityOfPrecipitation.values.reduce(extractPoint, [])
            const temp = weather.temperature.values.reduce(extractPoint, [])
            const windChill = weather.windChill.values.reduce(extractPoint, [])
            const graphStartTime = Date.now()
            const graphEndTime = Date.now() + (86400000 * DAYS)

            // color for canvas background
            const plugin = {
                id: 'custom_canvas_background_color',
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext('2d');
                    const chartArea = chart.chartArea

                    const chartWidth = chartArea.right - chartArea.left

                    for (i = 0; i < (DAYS + 1); i++) {
                        const sunset = new Date().sunset(currentLocation[0], currentLocation[1]).valueOf() + (86400000 * i)
                        const sunrise = new Date().sunrise(currentLocation[0], currentLocation[1]).valueOf() + (86400000 * i)

                        const pixelStart = chartArea.left + chartWidth * ((sunset - graphStartTime) / (graphEndTime - graphStartTime))
                        const pixelEnd = chartArea.left + chartWidth * ((sunrise - graphStartTime) / (graphEndTime - graphStartTime))

                        const grayStart = pixelStart > chartArea.right ? chartArea.right : (pixelStart < chartArea.left ? chartArea.left : pixelStart)
                        const grayEnd = pixelEnd > chartArea.right ? chartArea.right : (pixelEnd < chartArea.left ? chartArea.left : pixelEnd)

                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = 'lightGray';
                        ctx.fillRect(grayStart, chartArea.top, grayEnd - grayStart, chartArea.bottom - chartArea.top);
                        ctx.restore();
                    }
                }
            };

            const skyconfig = {
                type: 'line',
                data: { 
                    datasets: [{
                        label: 'Sky cover',
                        backgroundColor: 'rgb(117, 117, 117)',
                        borderColor: 'rgb(117, 117, 117)',
                        data: skyCover,
                        normalized: true,
                        parse: false,
                    }, {
                        label: 'Precipitation Potential',
                        backgroundColor: 'rgb(97, 175, 239)',
                        borderColor: 'rgb(97, 175, 239)',
                        data: precip,
                        normalized: true,
                        parse: false,
                    }] 
                },
                plugins: [plugin],
                options: {
                    aspectRatio: 6,
                    interaction: {
                        mode: 'x',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            type: "time",
                            min: graphStartTime,
                            max: graphEndTime,
                            ticks: {
                                maxRotation: 0,
                            },
                        },
                        y: {
                            ticks: {
                                callback: (value, index, values) => (value + '%')
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            }
            const tempconfig = {
                type: 'line',
                data: { 
                    datasets: [{
                        label: 'Temp.',
                        backgroundColor: 'rgb(255, 0, 0)',
                        borderColor: 'rgb(255, 0, 0)',
                        data: temp,
                        normalized: true,
                        parse: false,
                    }, {
                        label: 'Wind',
                        backgroundColor: 'rgb(97, 175, 239)',
                        borderColor: 'rgb(97, 175, 239)',
                        data: windChill,
                        normalized: true,
                        parse: false,
                    }] 
                },
                plugins: [plugin],
                options: {
                    aspectRatio: 6,
                    interaction: {
                        mode: 'x',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            type: "time",
                            min: graphStartTime,
                            max: graphEndTime,
                            ticks: {
                                maxRotation: 0,
                            },
                        },
                        y: {
                            ticks: {
                                callback: (value, index, values) => (value + '°')
                            },
                            min: 20,
                            max: 90
                        }
                    }
                }
            }
            var skyprecip = new Chart(document.getElementById('sky-precip'), skyconfig);
            var tempwindheat = new Chart(document.getElementById('temp-wind-heat'), tempconfig);
        })
}
fetch("https://ipinfo.io/json")
    .then(res => res.json())
    .then(obj => {currentLocation=obj.loc.split(","); return 'https://api.weather.gov/points/' + obj.loc;})
    .then(url => fetch(url))
    .then(res => res.json())
    .then(obj => obj.properties.forecastGridData)
    .then(url => loadCharts(url))
    .catch(err => {
        console.log(err)
        alert("Defaulting to Albany NY")
        loadChart("https://api.weather.gov/gridpoints/BOX/8,49")
    })
