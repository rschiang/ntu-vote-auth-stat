var margin = { top: 30, right: 60, bottom: 30, left: 60 };
var width = 960, height = 540;
var chart = d3.select("svg")
                .attr("preserveAspectRatio", "xMidYMid meet")
                .attr("viewBox", "0 0 "+width+" "+height)
                .append("g")
                .attr("transform", "translate("+margin.left+","+margin.top+")");

width -= margin.left + margin.right;
height -= margin.top + margin.bottom;

var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);
var color = {
    centered: function(i) {
        var rel = (i - (series.length / 2));
        var pos = ((rel > 0 ? 1 : 0) + Math.abs(rel) * 2) / (series.length + 1);
        return d3.interpolatePlasma(1 - pos);
    },
    stacked: function(i) {
        return d3.interpolatePlasma(1 - i / (series.length - 1));
    }
};
var area = d3.area()
            .x(function(d) { return x(d.data.time); })
            .y0(function(d) { return y(d[0]); })
            .y1(function(d) { return y(d[1]); })
            .curve(d3.curveMonotoneX);
var stack = d3.stack();
var graph = chart.append("g")
                .attr("class", "graph")
                .attr("transform", "translate(0,"+(-height/2)+")");

var parseTime = d3.timeParse("%H:%M");
var formatTime = d3.timeFormat("%I:%M%p");

var entries, series, seriesNames;
var table = d3.map();

var duration = 120, uiDuration = 70;

var xAxis = d3.axisBottom().scale(x);
var yAxis = d3.axisLeft().scale(y);

var timeRange = {
    starting: { hour: 9, minute: 30 },
    ending: { hour: 20, minute: 0 }
}

for (var h = timeRange.starting.hour, m = timeRange.starting.minute;
    h < timeRange.ending.hour || m <= timeRange.ending.minute;
    (m >= 45 ? (m = 0, h++) : m += 15))
    {
        t = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "00" : m);
        table.set(t, { time: parseTime(t), sum: 0 });
    }

var selector = chart.append("g")
    .attr("class", "selector")
    .attr("transform", "translate(0,0)")
    .attr("opacity", 0);

selector.append("line")
    .attr("x1", "0")
    .attr("x2", "0")
    .attr("y1", "0")
    .attr("y2", height)
    .attr("stroke", "white")
    .attr("stroke-width", "1px")
    .attr("style", "pointer-events: none");

var tooltip = chart.append("g")
    .attr("class", "tooltip")
    .attr("transform", "translate(20,20)");

tooltip.append("text")
    .attr("class", "time-field")
    .attr("fill", "#9e9e9e")
    .attr("font-size", "12px");

tooltip.append("text")
    .attr("class", "value-field")
    .attr("y", "24")
    .attr("font-size", "24px");

chart.append("g")
    .attr("class", "tooltip")
    .attr("transform", "translate("+(width-20)+",20)")
    .append("text")
    .attr("class", "series-field")
    .attr("text-anchor", "end")
    .attr("fill", "#9e9e9e")
    .attr("font-size", "12px");

d3.csv("data/105-2/station-time.csv", function(data) {
    entries = data;
    series = d3.nest()
                .key(function(d) { return d.station; })
                .map(entries).keys();

    d3.nest()
        .key(function(d) { return d.time; })
        .entries(entries)
        .forEach(function(t) {
            i = table.get(t.key);
            t.values.forEach(function(e) {
                i[e.station] = +e.count;
                i.sum += +e.count;
            });
            table.set(t.key, i);
        });

    table = table.values();

    x.domain(d3.extent(table, function(d) { return d.time; }));
    y.domain([0, d3.max(table, function(d) { return d.sum; }) * 1.05]);

    stack.keys(series)
        .value(function(d, key) { return d[key] || 0; })
        .order(d3.stackOrderInsideOut)
        .offset(d3.stackOffsetSilhouette);

    graph.selectAll(".series")
        .data(stack(table))
        .enter()
        .append("g")
        .attr("class", "series")
        .append("path")
        .attr("class", "area")
        .attr("opacity", 1)
        .on("mouseover", function(d, i) {
            graph.selectAll(".series")
                .transition().duration(uiDuration)
                .attr("opacity", function(d, j) {
                    return (j != i) ? 0.9 : 1;
                });
            d3.select(this)
                .attr("stroke", "rgba(0,0,0,.33)")
                .attr("stroke-width", "1px");
        })
        .on("mousemove", function(d, i) {
            var mousex = d3.mouse(this)[0];
            var invertedx = x.invert(mousex);
            for (var j in table) {
                item = table[j];
                if (Math.abs(item.time - invertedx) <= 450000) {
                    d3.selectAll(".tooltip")
                        .attr("visibility", "visible");
                    d3.select(".tooltip .time-field")
                        .text(formatTime(item.time) + " @ " + d.key);
                    d3.selectAll(".tooltip .series-field")
                        .text("同時段總計 " + item.sum);
                    d3.selectAll(".tooltip .value-field")
                        .text(item[d.key] || 0);
                    selector
                        .attr("transform", "translate("+mousex+",0)")
                        .attr("opacity", .87);
                    break;
                }
            }
        })
        .on("mouseout", function(d, i) {
            graph.selectAll(".series")
                .transition().duration(duration)
                .ease(d3.easeExpOut)
                .attr("opacity", 1);

            d3.select(this)
                .attr("stroke-width", "0px");
            d3.selectAll(".tooltip")
                .attr("visibility", "hidden");
            selector.attr("opacity", 0);
        });

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0,"+height+")")
        .call(xAxis);

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    streamgraph();
    duration = 420;
});

function streamgraph() {
    stack.order(d3.stackOrderInsideOut)
        .offset(d3.stackOffsetSilhouette);

    graph.transition().duration(duration)
        .attr("transform", "translate(0,"+(-height/2)+")");

    graph.selectAll(".series")
        .data(stack(table))
        .transition().duration(duration)
        .ease(d3.easeCubic)
        .select(".area")
        .attr("d", area)
        .style("fill", function(d) { return color.centered(d.index); })
}

function stackedArea() {
    stack.order(d3.stackOrderDescending)
        .offset(d3.stackOffsetNone);

    graph.transition().duration(duration)
        .attr("transform", "translate(0,0)");

    graph.selectAll(".series")
        .data(stack(table))
        .transition().duration(duration)
        .ease(d3.easeCubic)
        .select(".area")
        .attr("d", area)
        .style("fill", function(d) { return color.stacked(d.index); })
}

var toggle = false;
graph.on("click", function() {
    toggle = !toggle;
    if (toggle) stackedArea(); else streamgraph();
    d3.select(".hint").attr("visibility", "hidden");
});
