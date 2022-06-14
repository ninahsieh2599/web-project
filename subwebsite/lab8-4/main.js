//Data utilities
//遇到NA就設定為undefined,要不然就維持原本的字串
const parseNA = string => (string === 'NA' ? undefined : string);
//日期處理
//timeParse return a function 而後面的string會輸入進去
const parseData = string => d3.timeParse('%Y-%m-%d')(string);

function type(d){
    const date = parseData(d.release_date);
    return{
        budget:+d.budget,
        genre:parseNA(d.genre),
        genres:JSON.parse(d.genres).map(d=>d.name),
        homepage:parseNA(d.homepage),
        id:+d.id,
        imdb_id:parseNA(d.imdb_id),
        original_language:parseNA(d.original_language),
        overview:parseNA(d.overview),
        popularity:+d.popularity,
        poster_path:parseNA(d.poster_path),
        production_countries:JSON.parse(d.production_countries),
        release_date:date,
        release_year:date.getFullYear(),
        revenue:+d.revenue,
        runtime:+d.runtime,
        tagline:parseNA(d.tagline),
        title:parseNA(cutText(d.title)),
        vote_average:+d.vote_average,
        vote_count:+d.vote_count,
    }
}

//Data selection
function filterData(data){
    return data.filter(
        d=>{
            return(
                d.release_year > 1999 && d.release_year < 2010 && 
                d.revenue > 0 &&
                d.budget > 0 &&
                d.genre &&
                cutText(d.title)
            );
        }
    );
}

//已經過濾完的data 用rollup
// '=>' 指function
function prepareBarChartData(data){
    const dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.revenue),   //將revenue加總(依據特定項目計算)
        d => d.genre    //依電影分類groupby(用什麼來分組)
    );
    const dataArray = Array.from(dataMap, d=>({genre:d[0],revenue:d[1]}));  //可定key值
    return dataArray;
}

function formatTicks(d) {
    return d3.format('.2s')(d)
        .replace('M','mil')
        .replace('G','bil')
        .replace('T','tri')
}

function cutText(string){
    return string.length<35 ? string : string.substring(0,35)+"...";
}

function setupCanvas(barChartData, movieClean){
    //一開始預設指標是revenue
    let metric = 'revenue';

    function click(){
        metric = this.dataset.name;
        console.log(metric);
        const thisData = chooseData(metric, movieClean);
        update(thisData);
    }

    d3.selectAll('button').on('click',click);

    function update(data){
        console.log(data);
        //Update Scale
        xMax = d3.max(data, d=>d[metric]);
        xScale_v3 = d3.scaleLinear([0, xMax],[0,barchart_width]);

        yScale = d3.scaleBand().domain(data.map(d=>cutText(d.title)))
        .rangeRound([0, barchart_height])
        .paddingInner(0.25);

        //Transition Settings
        const defaultDelay = 1000
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update Header
        header.select('tspan').text(`Top 15 ${metric} movies ${metric==='popularity'?'':'in $US'}`);

        //Update Bar
        bars.selectAll('.bar').data(data, d=>cutText(d.title)).join(
            enter => {
                enter.append('rect').attr('class','bar')
                    .attr('x',0).attr('y',d=>yScale(cutText(d.title)))
                    .attr('height',yScale.bandwidth())
                    .style('fill','lightcyan')
                    .transition(transitionDelay)
                    .delay((d,i)=>i*20)
                    .attr('width',d=>xScale_v3(d[metric]))
                    .style('fill', '#66BAB7')
                    .attr('y',d=>yScale(cutText(d.title)))
                    
            },
            update => {
                update.transition(transitionDelay)
                    .delay((d,i)=>i*20)
                    .attr('y',d=>yScale(cutText(d.title)))
                    .attr('width',d=>xScale_v3(d[metric]))
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                    .style('fill-opacity',0)
                    .remove()
            }
        );

        //interactive 新增監聽
        d3.selectAll('.bar')
            .on('mouseover',mouseover)
            .on('mousemove',mousemove)
            .on('mouseout',mouseout);
    }

    //svg整個空間
    const svg_width = 700;
    const svg_height = 500;
    //margin
    const barchart_margin = {top:80,right:80,bottom:40,left:250};
    //圖表實際長寬
    const barchart_width = svg_width - (barchart_margin.left + barchart_margin.right);
    const barchart_height = svg_height - (barchart_margin.top + barchart_margin.bottom);

    const this_svg = d3.select('.bar-chart-container').append('svg')
        .attr('width', svg_width).attr('height', svg_height)
        .append('g')
        .attr('transform', `translate(${barchart_margin.left},${barchart_margin.top})`);

    //scale
    //2.data -> page, scale
    //V1.d3.extent find the max & min in revenue
    //v1.[min, Max] -> chart
    const xExtent = d3.extent(barChartData, d=>d.revenue);
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, barchart_width]);
    //V2.0 ~ max
    let xMax = d3.max(barChartData, d=>d.revenue);
    const xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0,barchart_width]);
    //V3.Short writing for v2
    let xScale_v3 = d3.scaleLinear([0,xMax],[0,barchart_width]);
    //垂直空間的分配 - 平均分布給各種類
    // let yScale = d3.scaleBand().domain(barChartData.map(d=>d.genre))
    //     .rangeRound([0, chart_height])
    //     .paddingInner(0.25);
    //垂直空間的分配 - 平均分布給Top 15
    let yScale = d3.scaleBand().domain(barChartData.map(d=>cutText(d.title)))
        .rangeRound([0, barchart_height])
        .paddingInner(0.25);

    //Draw bars
    // const bars = this_svg.selectAll('.bar')
    //     .data(barChartData)
    //     .enter()
    //     .append('rect')
    //     .attr('class', 'bar')
    //     .attr('x', 0)
    //     .attr('y', d=>yScale(d.genre))
    //     .attr('width', d=>xScale_v3(d.revenue))
    //     .attr('height',yScale.bandwidth())
    //     .style('fill', '#66BAB7')
    const bars = this_svg.append('g').attr('class','bars');

    //Draw header
    const header = this_svg.append('g').attr('class', 'bar-header')
        .attr('transform', `translate(0,${-barchart_margin.top/2})`)
        .append('text');
    //header.append('tspan').text('Total revenue by genre in $US');
    header.append('tspan').text('Total 15 XXX movies');
    header.append('tspan').text('Years:2000-2009')
        .attr('x',0).attr('y',20).style('font-size','0.8em').style('fill','#555');
    //tickSizeInner : the length of the tick lines
    //tickSizeOuter : the length of the square ends of the domain path
    const xAxis = d3.axisTop(xScale_v3)
        .ticks(5)
        .tickFormat(formatTicks)
        .tickSizeInner(-barchart_height)
        .tickSizeOuter(0);
    // const xAxisDraw = this_svg.append('g')
    //     .attr('class','x axis')
    //     .call(xAxis);
    const xAxisDraw = this_svg.append('g').attr('class','x axis');    
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    // const yAxisDraw = this_svg.append('g')
    //     .attr('class','y axis')
    //     .call(yAxis);
    const yAxisDraw = this_svg.append('g').attr('class','y axis');
    yAxisDraw.selectAll('text').attr('dx','-0.6em');
    update(barChartData);
    
    //interactive 互動處理
    const tip = d3.select('.tooltip');
    function mouseover(e){
        //get data
        const thisBarData = d3.select(this).data()[0];
        const bodyData = [
            ['Budget', formatTicks(thisBarData.budget)],
            ['Revenue', formatTicks(thisBarData.revenue)],
            ['Profit', formatTicks(thisBarData.revenue - thisBarData.budget)],
            ['TMDB Popularity', Math.round(thisBarData.popularity)],
            ['IMDB Rating', thisBarData.vote_average],
            ['Genres', thisBarData.genres.join(', ')]
        ]

        tip.style('left',(e.clientX+15)+'px')
            .style('top',e.clientY+'px')
            .transition()
            .style('opacity',0.98)
        
        tip.select('h3').html(`${thisBarData.title}, ${thisBarData.release_year}`);
        tip.select('h4').html(`${thisBarData.tagline}, ${thisBarData.runtime} min.`);
        
        d3.select('.tip-body').selectAll('p').data(bodyData)
            .join('p').attr('class', 'tip-info')
            .html(d=>`${d[0]} : ${d[1]}`);
    }
    function mousemove(e){
        tip.style('left',(e.clientX+15)+'px')
            .style('top',e.clientY+'px')
    }
    function mouseout(e){
        tip.transition()
            .style('opacity',0)
    }
    //interactive 新增監聽
    d3.selectAll('.bar')
        .on('mouseover',mouseover)
        .on('mousemove',mousemove)
        .on('mouseout',mouseout);
}

//Main
function ready(movies){
    const movieClean = filterData(movies);
    //Get Top 15 revenue movies
    const revenueData = chooseData("revenue",movieClean);
    setupCanvas(revenueData, movieClean);      //Draw the graph
}

//Load Data
d3.csv('data/movies.csv',type).then(
    res =>{
        ready(res)
        //console.log(res);
    }
);

function chooseData(metric, movieClean){
    const thisData = movieClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<15);
    return thisData;
}