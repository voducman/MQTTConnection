
database = {
    data: [],
    pageTotal: 0,
    pageCurrent: 0,

    updateData: function(){

        // Get 100 items lastest in Database
        $.get('/history/update')
        .done((result)=>{
            console.log("Length of data: " ,result.length);
            this.data = result;
            this.pageTotal = Math.ceil(result.length/10);
            if (this.pageTotal>0){
                renderTable(1);
            }
        })
        .fail(function(err){
            console.log(err);
        })
    },
}


$(document).ready(function(){
    database.updateData();

})


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


function renderTable(page){
    let row;
    $('#render-here').empty();
    database.data.slice((page-1)*10, (page-1)*10 + 10).forEach(function(ele, index){
        $('#render-here').append(renderRow(index+1 + (page-1)*10, ele));
    })

    if (database.pageTotal < 3){
        $('#page-nav').empty();
        if (database.pageTotal == 2 && page == 1){
            $('#page-nav').append(`
                <li class="page-item active"><a class="page-link" href="javascript:void(0);" onclick="renderTable(1)">1</a></li>
                <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(2)">2</a></li>
            `);
        }else if(database.pageTotal == 2 && page == 2){
            $('#page-nav').append(`
                <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(1)">1</a></li>
                <li class="page-item active"><a class="page-link" href="javascript:void(0);" onclick="renderTable(2)">2</a></li>
            `);
        }
    }else{
        renderPageNavigation(page);
    }
    
}
   

function renderRow(index, data){
    let row = `
    <tr >
    <th class="text-center" scope="row">${index}</th>
    <td class="text-center">${data.run}</td>
    <td class="text-center">${data.web_emer}</td>
    <td class="text-center">${data.val_v1}</td>
    <td class="text-center">${data.val_v2}</td>
    <td class="text-center">${data.val_v11}</td>
    <td class="text-center">${data.val_v22}</td>
    <td class="text-center">${data.total}</td>
    <td class="text-center">${fortmatTime(data.sendTime)}</td>
  </tr>`

  return row;
}

function renderPageNavigation(page){

    let pageNav = "";
    if (page > 2){
        pageNav += `
        <li class="page-item">
            <a class="page-link" href="javascript:void(0);" aria-label="Previous" onclick="renderTable(1)">
                <span aria-hidden="true">&laquo;</span>
                <span class="sr-only">Previous</span>
            </a>
        </li>
        `
    }
    
    if (page == 1){
        pageNav += `
            <li class="page-item active"><a class="page-link" href="javascript:void(0);" onclick="renderTable(1)">1</a></li>
            <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(2)">2</a></li>
            <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(3)">3</a></li>
        `
    }else if(page == database.pageTotal){
        pageNav += `
            <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(${database.pageTotal-2})">${database.pageTotal-2}</a></li>
            <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(${database.pageTotal-1})">${database.pageTotal-1}</a></li>
            <li class="page-item active"><a class="page-link" href="javascript:void(0);" onclick="renderTable(${database.pageTotal})">${database.pageTotal}</a></li>
        `
    }else{
        pageNav += `
            <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(${page-1})">${page-1}</a></li>
            <li class="page-item active"><a class="page-link" href="javascript:void(0);" onclick="renderTable(${page})">${page}</a></li>
            <li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="renderTable(${page + 1})">${page + 1}</a></li>
        `
    }




    if (page < (database.pageTotal - 1) && database.pageTotal > 3) {
        pageNav += `
        <li class="page-item">
            <a class="page-link" href="javascript:void(0);" aria-label="Next" onclick="renderTable(database.pageTotal)">
                <span aria-hidden="true">&raquo;</span>
                <span class="sr-only">Next</span>
            </a>
        </li>
        `
    }

    $('#page-nav').empty();
    $('#page-nav').append(pageNav);
}


$('#btn-excel').click(function () {
    let fromTime = new Date($('#datetimepicker1').data("DateTimePicker").date()._d);
    let toTime = new Date($('#datetimepicker2').data("DateTimePicker").date()._d);
    console.log(fromTime);
    console.log(toTime);
    $.post('/history/excel', {
        fromTime: fromTime,
        toTime: toTime
    })
        .done(function (result) {
            console.log(result);
            exportExcel(result);

        })
        .fail(function (err) {
            console.log(err);
        })
});

function exportExcel(data) {
    var wb = XLSX.utils.book_new();
    wb.Props = {
        Title: "Web-Based SCADA",
        Subject: "Thesis",
        Author: "Handsome Boy",
        CreatedDate: Date.now()
    };

    wb.SheetNames.push("sheet1");

    var ws_data = [['#', 'Run', 'Emer', 'Value V1', 'Value V2', 'Value V11', 'Value V22', 'Total', 'Time']];
    data.forEach(function(ele, index){
        ws_data.push([index, ele.run, ele.web_emer, ele.val_v1, ele.val_v2, ele.val_v11, ele.val_v22, ele.total, fortmatTime(ele.sendTime)]);
    })
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    wb.Sheets["sheet1"] = ws;
    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {

        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;

    }

    saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'thesis.xlsx');
}