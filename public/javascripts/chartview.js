document.querySelector('.bar-chart button').addEventListener('click', function(e){
    document.querySelectorAll('.bar-chart').forEach(function(element){
        element.classList.add('hidden');
    })

    document.querySelectorAll('.line-chart').forEach(function(element){
        element.classList.remove('hidden');
    })
})

document.querySelector('.line-chart button').addEventListener('click', function(e){
    document.querySelectorAll('.bar-chart').forEach(function(element){
        element.classList.remove('hidden');
    })

    document.querySelectorAll('.line-chart').forEach(function(element){
        element.classList.add('hidden');
    })
})

$('#TotalorVolume').change(function(){
    if ($(this).prop('checked')){
        isVolumeChart = false;
        updateChart();
     } else{
        clearChart();
        isVolumeChart = true;
     }
})


let labels = [];
let data = [];
let backgroundColor = []; 
let borderColor = [];
let isVolumeChart = false;
let isFirstOpenChart = true;
let lastDrawTotal = 0;
let lastTotal = 0;
let options = {
    responsive: true,
    scales: {
        xAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Thời gian'
            }
        }],
        yAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Giá trị'
            }
        }]
    },
    layout: {
        padding: {
            left: 50,
            right: 0,
            top: 0,
            bottom: 0,
        },
        width: 400,
        height: 400
    }
}

var ctxBar  = document.getElementById('totalBarChart').getContext('2d');
var ctxLine = document.getElementById('totalLineChart').getContext('2d');

var barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
        labels,
        datasets: [{
            label: '',
            data,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: 1,
        }]
    },
    options
});



var lineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
        labels,
        datasets: [{
            label: '',
            data,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: 1,
            lineTension: 0
        }],
    },
    options
});


setInterval(function(){
    $.get('/update')
    .done(function(result){
        if (typeof result == 'object'){

            let sendTime = new Date(result.sendTime);
            let total = parseInt(result.total);
            let timestamp = moment(sendTime).format('h:mm:ss A DD/MM/YYYY');
            if (isFirstOpenChart){
                lastTotal = total;
                isFirstOpenChart = false;
            }
            else if (parseInt(sendTime.getTime()) - lastDrawTotal > 5*60*1000){
                lastDrawTotal = sendTime.getTime();
                updateChart((total - lastTotal >= 0)? total - lastTotal : 0, timestamp);
                lastTotal = total;
            }
        }
    })
    .fail(function(err){
        console.log(err);
    })
}, 700);


function updateChart(point, time){
    if (typeof point != 'undefined' && time) {
        data.push(point);
        labels.push(time);
        backgroundColor.push('rgba(9, 17, 179, 0.2)');
        borderColor.push('rgba(9, 17, 179, 1)');
    };

    if (data.length > 24){
        data.shift();
        labels.shift();
        backgroundColor.shift();
        borderColor.shift();
    }

    if (isVolumeChart) return;

    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    barChart.data.datasets[0].backgroundColor = backgroundColor;
    barChart.data.datasets[0].borderColor = borderColor;
    barChart.update();

    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = data;
    lineChart.data.datasets[0].backgroundColor = backgroundColor;
    lineChart.data.datasets[0].borderColor = borderColor;
    lineChart.update();
}

function clearChart(){
    barChart.data.labels = [];
    barChart.data.datasets[0].data = [];
    barChart.data.datasets[0].backgroundColor = [];
    barChart.data.datasets[0].borderColor = [];
    barChart.update();

    lineChart.data.labels = [];
    lineChart.data.datasets[0].data = [];
    lineChart.data.datasets[0].backgroundColor = [];
    lineChart.data.datasets[0].borderColor = [];
    lineChart.update();
}


