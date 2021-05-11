const DAYS = 2;
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
let colorscheme = onelight;

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
