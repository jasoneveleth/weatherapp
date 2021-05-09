var currentLocation;
const DAYS = 2

function loadChart(url) {
    console.log("localURL:",url)
    console.log("currentLocation:", currentLocation)
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

                        const grayStart = pixelStart < chartArea.left ? chartArea.left : pixelStart
                        const grayEnd = pixelEnd > chartArea.right ? chartArea.right : pixelEnd

                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = 'lightGray';
                        ctx.fillRect(grayStart, chartArea.top, grayEnd - grayStart, chartArea.bottom - chartArea.top);
                        ctx.restore();
                    }
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
                    interaction: {
                        mode: 'x',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            type: "time",
                            min: graphStartTime,
                            max: graphEndTime,
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
            var myChart = new Chart(document.getElementById('myChart'), config);
        })
}
fetch("https://ipinfo.io/json")
    .then(res => res.json())
    .then(obj => {currentLocation=obj.loc.split(","); return 'https://api.weather.gov/points/' + obj.loc;})
    .then(url => fetch(url))
    .then(res => res.json())
    .then(obj => obj.properties.forecastGridData)
    .then(url => loadChart(url))
    .catch(err => {
        console.log(err)
        alert("Defaulting to Albany NY")
        loadChart("https://api.weather.gov/gridpoints/BOX/8,49")
    })
