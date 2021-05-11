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
            skyconfig.options.scales.y.afterSetDimensions = (axes) => { axes.maxWidth = 32; }
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
            skyconfig.options.scales.y.ticks.callback = (value, index, values) => (value + '%')
            skyconfig.options.scales.y.min = 0
            skyconfig.options.scales.y.max = 100

            let tempconfig = JSON.parse(JSON.stringify(genericconfig))
            tempconfig.plugins = [plugin] // can't be copied by json stringify
            tempconfig.options.scales.y.afterSetDimensions = (axes) => { axes.maxWidth = 32; }
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
            tempconfig.options.scales.y.ticks.callback =  (value, index, values) => (value + '°')
            tempconfig.options.scales.y.min = 20
            tempconfig.options.scales.y.max = 90

            let skyprecip = new Chart(document.getElementById('sky-precip'), skyconfig);
            let tempwindheat = new Chart(document.getElementById('temp-wind-heat'), tempconfig);
            charts = [skyprecip, tempwindheat]
        })
}

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
