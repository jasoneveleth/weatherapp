// GLOBALS --------------------------------------------------
let colorscheme = onelight;
let longlat;
let charts = [];
// END GLOBALS ----------------------------------------------

// CONSTRUCTORS ---------------------------------------------
// color for canvas background
function Plugin() {
    return {
        id: 'custom_canvas_background_color',
        beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            const chartArea = chart.chartArea
            const chartWidth = chartArea.right - chartArea.left

            for (i = 0; i < (DAYS + 1); i++) {
                const sunset = new Date().sunset(longlat[0], longlat[1]).valueOf() + (86400000 * i)
                const sunrise = new Date().sunrise(longlat[0], longlat[1]).valueOf() + (86400000 * i)

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
    }
}

// generic config -- all the similarities of the sky and temp
function Generic() {
    return {
        type: 'line',
        data: {
            datasets: [],
        },
        options: {
            maintainAspectRatio: false,
            interaction: {
                mode: 'x',
                intersect: false,
            },
            scales: {
                x: {
                    min: graphStartTime,
                    max: graphEndTime,
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
                    grid: {
                        color: colorscheme.mono2,
                    },
                }
            }
        }
    }
}

function SkyConfig(points) {
    let skyconfig = JSON.parse(JSON.stringify(Generic()))
    skyconfig.plugins = [Plugin()] // can't be copied by json stringify
    skyconfig.options.scales.y.afterSetDimensions = (axes) => { axes.maxWidth = 32; }
    skyconfig.data.datasets = [{
        label: 'Sky cover',
        backgroundColor: colorscheme.mono2,
        borderColor: colorscheme.mono2,
        data: points.skyCover,
        normalized: true,
        parse: false,
    }, {
        label: 'Precipitation Potential',
        backgroundColor: colorscheme.blue,
        borderColor: colorscheme.blue,
        data: points.precip,
        normalized: true,
        parse: false,
    }] 
    skyconfig.options.scales.y.ticks.callback = (value, index, values) => (value + '%')
    skyconfig.options.scales.y.min = 0
    skyconfig.options.scales.y.max = 100
    return skyconfig
}

function TempConfig(points) {
    let tempconfig = JSON.parse(JSON.stringify(Generic()))
    tempconfig.plugins = [Plugin()] // can't be copied by json stringify
    tempconfig.options.scales.y.afterSetDimensions = (axes) => { axes.maxWidth = 32; }
    tempconfig.data.datasets = [{
        label: 'Temperature',
        backgroundColor: colorscheme.red1,
        borderColor: colorscheme.red1,
        data: points.temp,
        normalized: true,
        parse: false,
    }, {
        label: 'Wind Chill',
        backgroundColor: colorscheme.purple,
        borderColor: colorscheme.purple,
        data: points.windChill,
        normalized: true,
        parse: false,
    }] 
    tempconfig.options.scales.y.ticks.callback =  (value, index, values) => (value + '°')
    tempconfig.options.scales.y.min = 20
    tempconfig.options.scales.y.max = 90
    return tempconfig
}
// END CONSTRUCTORS -----------------------------------------

// FUNCTIONS ------------------------------------------------
function settitle(str) {
    document.getElementById("location").innerHTML = str
}

function celcius2faren(acc, val) {
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

function loadCharts(weatherData) {
    const weather = weatherData.properties
    weather.temperature.values = weather.temperature.values.reduce(celcius2faren, [])
    weather.windChill.values = weather.windChill.values.reduce(celcius2faren, [])

    const skyCover = weather.skyCover.values.reduce(extractPoint, [])
    const precip = weather.probabilityOfPrecipitation.values.reduce(extractPoint, [])
    const temp = weather.temperature.values.reduce(extractPoint, [])
    const windChill = weather.windChill.values.reduce(extractPoint, [])

    const skyconfig = SkyConfig({'skyCover': skyCover, 'precip': precip})
    const tempconfig = TempConfig({'temp': temp, 'windChill': windChill})

    let skyprecip = new Chart(document.getElementById('sky-precip'), skyconfig);
    let tempwindheat = new Chart(document.getElementById('temp-wind-heat'), tempconfig);
    charts = [skyprecip, tempwindheat]
}

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
// END FUNCTIONS --------------------------------------------

// MAIN
// auto change dark mode
window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', event => {
        if (event.matches) {
            setcolorscheme(onedark)
        } else {
            setcolorscheme(onelight)
        }
    })

// set initial dark mode
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setcolorscheme(onedark)
} else {
    setcolorscheme(onelight)
}

if (localStorage.getItem('weatherData') != null) { // cached
    locationData = JSON.parse(localStorage.getItem('locationData'))
    settitle("Weather statistics for " + locationData.city + ', ' + locationData.region)
    longlat = locationData.loc

    weatherData = JSON.parse(localStorage.getItem('weatherData'))
    console.log("cached data:", weatherData)
    loadCharts(weatherData)
} else { // not cached
    fetch("https://ipinfo.io/json")
        .then(res => res.json())
        .then(obj => { // location data json
            localStorage.setItem('locationData', JSON.stringify(obj))
            longlat = obj.loc
            settitle("Weather statistics for " + obj.city + ', ' + obj.region)
            localStorage.setItem('weatherData', JSON.stringify(obj))
            return 'https://api.weather.gov/points/' + obj.loc
        })
        .then(url => fetch(url))
        .then(res => res.json())
        .then(obj => obj.properties.forecastGridData)
        .then(url => { // weather api url
            console.log("data:", url)
            return fetch(url)
        })
        .then(res => res.json())
        .then(obj => { // weather json
            localStorage.setItem('weatherData', JSON.stringify(obj))
            loadCharts(obj)
        })
        .catch(err => {
            console.log(err)
            alert("Defaulting to Albany NY")
            console.log("https://api.weather.gov/gridpoints/BOX/8,49")
            longlat = ["42.7003", "-73.8575"]
            fetch("https://api.weather.gov/gridpoints/BOX/8,49")
                .then(res => res.json())
                .then(obj => loadCharts(obj))
        })
}
