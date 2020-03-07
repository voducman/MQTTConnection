var data = {
    run: false,
    web_emer: false,
    val_v1: 0,
    val_v2: 0,
    val_v11: 0,
    val_v22: 0,
    total: 0,
    sendTime: 0,
}

var idOfTimer = 0;

setInterval(function(){
    $.get('/update')
    .done(function(result){
        if (typeof result == 'object'){
            
            deleteDisconnected();
            // Update state of dashboard
            data.run = Boolean(result.run),
            data.web_emer = Boolean(result.web_emer),
            data.val_v1  = parseInt(result.val_v1),
            data.val_v2  = parseInt(result.val_v2),
            data.val_v11 = parseInt(result.val_v11),
            data.val_v22 = parseInt(result.val_v22),
            data.total   = parseInt(result.total),
            data.sendTime = fortmatTime(result.sendTime)
            
            updateDashboard();
        }else{
            // Gateway was disconned
            if (idOfTimer == 0){
                idOfTimer = showDisconnected();
            }   
        }
    })
    .fail(function(err){
        console.log(err)
    })
}, 700);


$('#btn-start').click(function(){
    $.post('/send2PLC', {
        run: true
    }).done(function(result){
        console.log("write success: ", result);
    })
    .fail(function(err){
        console.log(err);
    })
})

$('#btn-stop').click(function(){
    $.post('/send2PLC', {
        run: false
    }).done(function(result){
        console.log("write success: ", result);
    })
    .fail(function(err){
        console.log(err);
    })
})

$('#btn-reset').click(function(){
    flashReset();
    $.post('/send2PLC', {
        web_reset: true
    }).done(function(result){
        console.log("write success: ", result);
    })
    .fail(function(err){
        console.log(err);
    })

})

$('#btn-emer').click(function(){  
    $.post('/send2PLC', {
        web_emer: !data.web_emer
    }).done(function(result){
        console.log("write success: ", result);
    })
    .fail(function(err){
        console.log(err);
    })
})

$('#btn-write').click(function(){  
    let ele = Array.from(document.querySelectorAll('input[name="optradio"]')).find(function(element){
        if (element.checked) return element;
    })
    console.log(ele.dataset.tag);
    console.log($('#quantity').val())
    switch (ele.dataset.tag){
        case 'val_v1': data = {val_v1: $('#quantity').val()}; break;
        case 'val_v2': data = {val_v2: $('#quantity').val()}; break;
        case 'val_v11': data = {val_v11: $('#quantity').val()}; break;
        case 'val_v22': data = {val_v22: $('#quantity').val()}; break;
    }

    $.post('/send2PLC', data)
    .done(function(result){
        console.log("write success: ", result);
    })
    .fail(function(err){
        console.log(err);
    })
})

function showDisconnected(){

    let id;
    id = setInterval(function(){
        Array.from(document.querySelectorAll('.fa-circle')).forEach(function(ele, index){
            if (ele.classList.contains('state-off')){
                ele.classList.remove('state-off');
                ele.classList.add('state-on');
            }else{
                ele.classList.remove('state-on');
                ele.classList.add('state-off');
            }
        })
    }, 400);

    return id;
}

function deleteDisconnected(){
    
    clearInterval(idOfTimer);
    idOfTimer = 0;

    $('#state-reset').removeClass('state-on');
    $('#state-reset').addClass('state-off');
}


function updateDashboard(){
    $('#tag-run').text(data.run);
    $('#tag-run-time').text(data.sendTime);
    $('#tag-web_emer').text(data.web_emer);
    $('#tag-web_emer-time').text(data.sendTime);
    $('#tag-val_v1').text(data.val_v1);
    $('#tag-val_v1-time').text(data.sendTime);
    $('#tag-val_v2').text(data.val_v2);
    $('#tag-val_v2-time').text(data.sendTime);
    $('#tag-val_v11').text(data.val_v11);
    $('#tag-val_v11-time').text(data.sendTime);
    $('#tag-val_v22').text(data.val_v22);
    $('#tag-val_v22-time').text(data.sendTime);
    $('#tag-total').text(data.total);
    $('#tag-total-time').text(data.sendTime);

    if (data.run){
        $('#state-run').removeClass('state-off');
        $('#state-run').addClass('state-on');
    }else{
        $('#state-run').removeClass('state-on');
        $('#state-run').addClass('state-off');
    }

    if (data.web_emer){
        $('#state-emer').removeClass('state-off');
        $('#state-emer').addClass('state-on');
    }else{
        $('#state-emer').removeClass('state-on');
        $('#state-emer').addClass('state-off');
    }
}


function flashReset(){
    $('#state-reset').removeClass('state-off');
    $('#state-reset').addClass('state-on');

    setTimeout(function(){
        $('#state-reset').removeClass('state-on');
        $('#state-reset').addClass('state-off');
    }, 1000)
}

function fortmatTime(time){
    let date = new Date(time);
    let year = date.getFullYear();
    let month = date.getMonth();
    let date_ = date.getDate();
    let hour  = date.getHours();
    let min   = date.getMinutes();
    let second = date.getSeconds();
    return `${hour}:${min}:${second} - ${date_}/${month}/${year}`;
}