var currentLocation;
const DAYS = 2
const onedark = {
    mono1: '#abb2bf',
    mono2: '#828997',
    mono3: '#5c6370',
    cyan: '#56b5c2',
    blue: '#61afef',
    purple: '#c678dd',
    green: '#98c379',
    red1: '#e06c75',
    red2: '#be5046',
    orange1: '#d19a66',
    orange2: '#e5c07b',
    fg: '#abb2bf', // mono-1
    bg: '#282c34',
    gutter: '', // darken(fg, 26%)
    guide: '', // fade(fg, 15%)
    accent: '#528cff',
}
const onelight = {
    mono1: '#383a42',
    mono2: '#696c77',
    mono3: '#a0a1a7',
    cyan: '#0184bc',
    blue: '#4078f2',
    purple: '#a626a4',
    green: '#50a14f',
    red1: '#e45649',
    red2: '#ca1243',
    orange1: '#986801',
    orange2: '#c18401',
    fg: '#383a42', // mono-1
    bg: '#fafafa',
    gutter: '', // darken(bg, 36%)
    guide: '', // fade (fg, 20%)
    accent: '#526fff',
}
const colorscheme = onelight
Chart.defaults.color = colorscheme.fg
document.getElementsByTagName('body')[0].style = "background: " + colorscheme.bg

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
                        backgroundColor: colorscheme.mono2,
                        borderColor: colorscheme.mono2,
                        data: skyCover,
                        normalized: true,
                        parse: false,
                    }, {
                        label: 'Precipitation Potential',
                        backgroundColor: colorscheme.blue,
                        borderColor: colorscheme.blue,
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
                        label: 'Temperature',
                        backgroundColor: colorscheme.red1,
                        borderColor: colorscheme.red1,
                        data: temp,
                        normalized: true,
                        parse: false,
                    }, {
                        label: 'Wind Chill',
                        backgroundColor: colorscheme.purple,
                        borderColor: colorscheme.purple,
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
