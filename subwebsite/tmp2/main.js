$(function()
{
    $("#courseTable").append("<tr><th>場次</th><th>時間</th><th>主題</th></tr>");
    
    let topicCount = topic.length;
    
    let millisecsPerDay = 24*60*60*1000;

    for(var x = 0; x < topicCount; x++)
    {
        let s = (new Date(startDate.getTime()+7*x*millisecsPerDay)).toLocaleDateString()
        let arr = s.split("/")

        //if(topic[x].includes('假日'))
        $("#courseTable").append(
            // yyyy/mm/dd
//            `<tr><td>${x+1}</td><td>${(setMonthAndDay(startDate.getMonth(), startDate.getDate()+7*x))}</td><td>${topic[x]}</td></tr>`);
            //sol-1
//            `<tr><td>${x+1}</td><td>${arr[1]+'/'+arr[2]}</td><td>${topic[x]}</td></tr>`);
            //sol-2
            `<tr><td>${x+1}</td><td>${s.slice(5)}</td><td>${topic[x]}</td></tr>`);

    }
});