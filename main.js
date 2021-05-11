function setcolorscheme(argcolor) {
    colorscheme = argcolor
    Chart.defaults.color = colorscheme.fg
    Chart.defaults.borderColor = colorscheme.mono3
    document.getElementsByTagName('body')[0].style.background = colorscheme.bg
    document.getElementById("location").style.color = colorscheme.fg
    for (let i = 0; i < charts.length; i++) {
        charts[i].options.scales.x.ticks.color = colorscheme.fg
        charts[i].options.scales.y.ticks.color = colorscheme.fg
        charts[i].options.scales.x.grid.color = colorscheme.mono2
        charts[i].options.scales.y.grid.color = colorscheme.mono2
        charts[i].update()
    }
}

function faren(acc, val) {
    if (val.value === null) {
        return acc.concat([{validTime: val.validTime, value: null}])
    } else {
        return acc.concat([{validTime: val.validTime, value: val.value * 9 / 5 + 32}])
    }
}

function extractPoint(acc, val) {
    const iso8601 = val.validTime.match(/^[-0-9T:+]+/)[0]
    const date = new Date(iso8601)
    return acc.concat([{x: date.valueOf(), y: val.value}])
}

function loadCharts(url) {
    console.log("data:",url)
    console.log("currentLocation: " + currentLocationData.city + ', ' + currentLocationData.region)
    document.getElementById("location").innerHTML="Weather statistics for " + currentLocationData.city + ', ' + currentLocationData.region
    currentLocation = currentLocationData.loc.split(",")
    fetch(url)
        .then(res => res.json())
        .then((obj) => {
            const weather = obj.properties
            weather.temperature.values = weather.temperature.values.reduce(faren, [])
            weather.windChill.values = weather.windChill.values.reduce(faren, [])

            const skyCover = weather.skyCover.values.reduce(extractPoint, [])
            const precip = weather.probabilityOfPrecipitation.values.reduce(extractPoint, [])
            const temp = weather.temperature.values.reduce(extractPoint, [])
            const windChill = weather.windChill.values.reduce(extractPoint, [])

            let skyconfig = JSON.parse(JSON.stringify(genericconfig))
            skyconfig.plugins = [plugin] // can't be copied by json stringify
            skyconfig.data.datasets = [{
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
            skyconfig.options.scales.x.min = graphStartTime
            skyconfig.options.scales.x.max = graphEndTime
            skyconfig.options.scales.y.ticks = { callback: (value, index, values) => (value + '%') }
            skyconfig.options.scales.y.min = 0
            skyconfig.options.scales.y.max = 100

            let tempconfig = JSON.parse(JSON.stringify(genericconfig))
            tempconfig.plugins = [plugin] // can't be copied by json stringify
            tempconfig.data.datasets = [{
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
            tempconfig.options.scales.x.min = graphStartTime
            tempconfig.options.scales.x.max = graphEndTime
            tempconfig.options.scales.y.ticks =  { callback: (value, index, values) => (value + '°') }
            tempconfig.options.scales.y.min = 20
            tempconfig.options.scales.y.max = 90

            let skyprecip = new Chart(document.getElementById('sky-precip'), skyconfig);
            let tempwindheat = new Chart(document.getElementById('temp-wind-heat'), tempconfig);
            charts = [skyprecip, tempwindheat]
        })
}

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
let colorscheme = onelight

let currentLocationData;
let currentLocation;
let charts = [];
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
            ctx.fillStyle = colorscheme.mono3;
            ctx.fillRect(grayStart, chartArea.top, grayEnd - grayStart, chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    }
};

const genericconfig = {
    type: 'line',
    data: {
        datasets: [],
    },
    options: {
        // aspectRatio: 5,
        maintainAspectRatio: false,
        interaction: {
            mode: 'x',
            intersect: false,
        },
        scales: {
            x: {
                type: "time",
                ticks: {
                    maxRotation: 0,
                    color: colorscheme.fg,
                },
                grid: {
                    color: colorscheme.mono2,
                },
            },
            y: {
                ticks: {
                    crossAlign: 'start',
                    color: colorscheme.fg,
                },
                afterSetDimensions: (scale) => {
                    scale.maxWidth = 30;
                },
                grid: {
                    color: colorscheme.mono2,
                },
            }
        }
    }
}

window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', event => {
        if (event.matches) {
            setcolorscheme(onedark)
        } else {
            setcolorscheme(onelight)
        }
    })

// MAIN
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setcolorscheme(onedark)
} else {
    setcolorscheme(onelight)
}
fetch("https://ipinfo.io/json")
    .then(res => res.json())
    .then(obj => {currentLocationData = obj; return 'https://api.weather.gov/points/' + obj.loc;})
    .then(url => fetch(url))
    .then(res => res.json())
    .then(obj => obj.properties.forecastGridData)
    .then(url => loadCharts(url))
    .catch(err => {
        console.log(err)
        alert("Defaulting to Albany NY")
        loadChart("https://api.weather.gov/gridpoints/BOX/8,49")
    })
