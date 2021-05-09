function loadChart(url) {
    console.log("localURL:",url)
    console.log("CurrentLocation:", currentLocation)
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
                    //const sunset = 1620432000000
                    //const sunrise = 1620468000000
                    var sunset = new Date().sunset(currentLocation[0], currentLocation[1]);
                    var sunrise = new Date().sunrise(currentLocation[0], currentLocation[1]);

                    var grayStart = chartArea.left + chartWidth * ((sunset - startTime) / (endTime - startTime))
                    var grayEnd = chartArea.left + chartWidth * ((sunrise - startTime) / (endTime - startTime))

                    if (grayStart<chartArea.left) { grayStart=chartArea.left}
                    if (grayEnd>chartArea.right) { grayEnd=chartArea.right}

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
                            min: startTime,
                            max: endTime,
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
    .then(obj => {const currentLocation=obj.loc.split(","); return 'https://api.weather.gov/points/' + obj.loc;})
    .then(url => fetch(url))
    .then(res => res.json())
    .then(obj => obj.properties.forecastGridData)
    .then(url => loadChart(url))
    .catch(err => {
        console.log(err)
        alert("Defaulting to Albany NY")
        loadChart("https://api.weather.gov/gridpoints/BOX/8,49")
    })
