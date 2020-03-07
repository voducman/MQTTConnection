(function(){
    let path = location.pathname.replace('/','').replace('/','');
    console.log(path);
    Array.from(document.querySelectorAll('.utils')).forEach(function(ele, index){
        // console.log(ele);
        if (ele.classList.contains(`${path}`)){
            ele.classList.add('active');
        }
    })
})();