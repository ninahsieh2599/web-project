/*$(function(){
    var numberOfListItem = $("li").length;
    var randomChildNumber = -1
    $("input").on("click",function(){        
        var tmp = Math.floor(Math.random()*numberOfListItem);
        while (randomChildNumber == tmp)
        {
            tmp = Math.floor(Math.random()*numberOfListItem);
        }
        randomChildNumber = tmp;

        var rcn = (randomChildNumber+1).toString();
        $("h1").text($("li").eq(randomChildNumber).text());
        $("#photo").attr("src", 'image/0'+rcn+'.jpg');
    });
});*/

//可加機率功能
//local storage
var randomChildNumber = -1
function rnd() {
    var ul = document.getElementById('foodList').getElementsByTagName('li');
    var tmp = Math.floor(Math.random()*ul.length);
    while(randomChildNumber == tmp){
        tmp = Math.floor(Math.random()*ul.length);
    }
    randomChildNumber = tmp;

    var food = ul[randomChildNumber];
    var h1 = document.getElementsByTagName('h1')[0];
    h1.innerHTML = food.innerHTML;
    var photoNum = (randomChildNumber+1).toString();
    document.getElementById('photo').src='image/0'+photoNum+'.jpg';

    for(var i = 0; i < ul.length; i++){
        if(i == randomChildNumber){
            ul[i].style.color = 'blue';
            ul[i].style.fontWeight = 'bold';
        }
        else{
            ul[i].style.color = 'black'
            ul[i].style.fontWeight = 'normal';
        }
    }
}