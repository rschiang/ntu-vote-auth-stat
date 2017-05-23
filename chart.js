//

/* Utility functions */
var time = {
    parse: d3.timeParse("%H:%M"),
    format: d3.timeFormat("%I:%M%p")
}

/* Chart onjects */
var timeChart = (function() {
    var self = {
        width: 960,
        height: 540,
        margin: { top: 30, right: 60, bottom: 30, left: 60 },
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        duration: 420,
        uiDuration: 70
    };

    self.init = function() {
        // Create chart elements
        self.svgElement = d3.select("svg")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 "+self.width+" "+self.height);
        self.chart = self.svgElement.append("g")
            .attr("transform", "translate("+self.margin.left+","+self.margin.top+")");

        self.width -= self.margin.left + self.margin.right;
        self.height -= self.margin.top + self.margin.bottom;

        self.x = d3.scaleTime().range([0, self.width]);
        self.y = d3.scaleLinear().range([self.height, 0]);

        self.graphArea = self.chart.append("g")
            .attr("class", "graph")
            .attr("transform", "translate(0,"+(-self.height/2)+")");

        self.graphArea.on("click", self.toggleChartType);

        self.xAxis = d3.axisBottom().scale(self.x);
        self.yAxis = d3.axisLeft().scale(self.y);

        self.selector = self.chart.append("g")
            .attr("class", "selector")
            .attr("transform", "translate(0,0)")
            .attr("opacity", 0);

        self.selector.append("line")
            .attr("x1", "0")
            .attr("x2", "0")
            .attr("y1", "0")
            .attr("y2", self.height)
            .attr("stroke", "white")
            .attr("stroke-width", "1px")
            .attr("style", "pointer-events: none");

        self.tooltip = {};

        var tooltipElement = self.chart.append("g")
            .attr("class", "tooltip")
            .attr("transform", "translate(20,20)");

        self.tooltip.time = tooltipElement.append("text")
            .attr("class", "time-field")
            .attr("fill", "#9e9e9e")
            .attr("font-size", "12px");

        self.tooltip.value = tooltipElement.append("text")
            .attr("class", "value-field")
            .attr("y", "24")
            .attr("font-size", "24px");

        tooltipElement = self.chart.append("g")
            .attr("class", "tooltip")
            .attr("transform", "translate("+(self.width-20)+",20)");

        self.tooltip.series = tooltipElement.append("text")
            .attr("class", "series-field")
            .attr("text-anchor", "end")
            .attr("fill", "#9e9e9e")
            .attr("font-size", "12px");

        // Pre-initialize axes
        self.xAxisElement = self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,"+self.height+")");

        self.yAxisElement = self.chart.append("g")
            .attr("class", "y axis");

        // Visualization helpers
        self.defaultColors = {};

        self.defaultColors.stream = function(d) {
            var len = self.series.length;
            var rel = (d.index - (len / 2));
            var pos = ((rel > 0 ? 1 : 0) + Math.abs(rel) * 2) / (len + 1);
            return d3.interpolatePlasma(1 - pos);
        }

        self.defaultColors.stacked = function(d) {
            return d3.interpolatePlasma(1 - d.index / (self.series.length - 1));
        }
    };

    self.initData = function(meta) {
        // Initialize data-related objects
        self.table = d3.map();
        self.stack = d3.stack();
        self.area = d3.area()
            .x(function(d) { return self.x(d.data.time); })
            .y0(function(d) { return self.y(d[0]); })
            .y1(function(d) { return self.y(d[1]); })
            .curve(d3.curveMonotoneX);

        // Prefill time slots to correctly plot across time
        for (var h = meta.startTime.hour, m = meta.startTime.minute;
            h < meta.endTime.hour || m <= meta.endTime.minute;
            ((60 - m) <= meta.gap  ? (m = 0, h++) : m += meta.gap))
        {
            t = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "00" : m);
            self.table.set(t, { time: time.parse(t), sum: 0 });
        }

        // Set up visualization overrides if needed
        self.colors = meta.colors || self.defaultColors;

        d3.csv(meta.dataPath, function(data) {
            // Extract series first, as stacked graph groups by x-axis (time)
            self.entries = data;
            self.series = d3.nest()
                .key(meta.column)
                .map(data).keys();

            // Fill data into preallocated time slots
            d3.nest()
                .key(function(d) { return d.time; })
                .entries(data)
                .forEach(function(t) {
                    i = self.table.get(t.key);
                    t.values.forEach(function(e) {
                        i[meta.column(e)] = +e.count;
                        i.sum += +e.count;
                    });
                    self.table.set(t.key, i);
                });

            // Now the key serve no use for us
            self.table = self.table.values();

            // Set up new axis scales
            self.x.domain(d3.extent(self.table, function(d) { return d.time; }));
            self.y.domain([0, d3.max(self.table, function(d) { return d.sum; }) * 1.05]);

            // Update axes
            self.xAxisElement.call(self.xAxis);
            self.yAxisElement.call(self.yAxis);

            // Initialize stacked graphs
            self.stack.keys(self.series)
                .value(function(d, key) { return d[key] || 0; });

            // Create series
            var selection = self.graphArea.selectAll(".series")
                .data(self.stack(self.table));

            selection.enter()
                .append("g")
                .attr("class", "series")
                .append("path")
                .attr("class", "area")
                .attr("opacity", 1)
                .on("mouseover", self.onSeriesMouseOver)
                .on("mousemove", self.onSeriesMouseMove)
                .on("mouseout", self.onSeriesMouseLeave);

            selection.exit()
                .remove();

            // Initialize graph by its type
            if (self.isStackedArea)
                self.stackedArea();
            else
                self.streamgraph();
        });
    };

    self.onSeriesMouseOver = function(d, i) {
        self.graphArea.selectAll(".series")
            .transition().duration(self.uiDuration)
            .attr("opacity", function(d, j) {
                return (j != i) ? 0.9 : 1;
            });
        d3.select(this)
            .attr("stroke", "rgba(0,0,0,.33)")
            .attr("stroke-width", "1px");
    };

    self.onSeriesMouseMove = function(d, i) {
        var mousex = d3.mouse(this)[0];
        var invertedx = self.x.invert(mousex);
        for (var j in self.table) {
            item = self.table[j];
            // Find nearest item to display
            if (Math.abs(item.time - invertedx) <= 450000) {
                // Make all tooltip fields visible
                d3.selectAll(".tooltip")
                    .attr("visibility", "visible");

                // Fill tooltips wirh values
                self.tooltip.time.text(time.format(item.time) + " @ " + d.key);
                self.tooltip.series.text("同時段總計 " + item.sum);
                self.tooltip.value.text(item[d.key] || 0);
                self.selector
                    .attr("transform", "translate("+mousex+",0)")
                    .attr("opacity", .87);
                break;
            }
        }
    };

    self.onSeriesMouseLeave = function(d, i) {
        // Restore visual effects
        self.graphArea.selectAll(".series")
            .transition().duration(self.duration)
            .ease(d3.easeExpOut)
            .attr("opacity", 1);

        d3.select(this)
            .attr("stroke-width", "0px");

        d3.selectAll(".tooltip")
            .attr("visibility", "hidden");

        self.selector.attr("opacity", 0);
    };

    self.streamgraph = function(duration) {
        duration = duration || self.duration;

        self.stack.order(d3.stackOrderInsideOut)
            .offset(d3.stackOffsetSilhouette);

        self.graphArea.transition().duration(duration)
            .attr("transform", "translate(0,"+(-self.height/2)+")");

        self.graphArea.selectAll(".series")
            .data(self.stack(self.table))
            .transition().duration(duration)
            .ease(d3.easeCubic)
            .select(".area")
            .attr("d", self.area)
            .style("fill", function(d) { return self.colors.stream(d); });
    };

    self.stackedArea = function(duration) {
        duration = duration || self.duration;

        self.stack.order(d3.stackOrderDescending)
            .offset(d3.stackOffsetNone);

        self.graphArea.transition().duration(duration)
            .attr("transform", "translate(0,0)");

        self.graphArea.selectAll(".series")
            .data(self.stack(self.table))
            .transition().duration(duration)
            .ease(d3.easeCubic)
            .select(".area")
            .attr("d", self.area)
            .style("fill", function(d) { return self.colors.stacked(d); })
    };

    self.toggleChartType = function() {
        self.isStackedArea = !self.isStackedArea;
        if (self.isStackedArea)
            self.stackedArea();
        else {
            self.streamgraph();
        }
    }

    return self;
})();
