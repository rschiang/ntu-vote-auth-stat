// Shared metadata and coloring styles
var college = (function() {
    var self = {
        labels: ['文學院', '理學院', '社會科學院', '醫學院', '工學院', '生物資源暨農學院', '管理學院', '公衛學院', '電機資訊學院', '法律學院', '生命科學院'],
        colors: ["#9e9e9e","#ffea00","#3f51b5","#4caf50","#ff9800","#ffee58","#607d8b","#f44336","#2196f3","#9c27b0","#00bcd4"],
        ids: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B']
    };

    self.coloring = function(d) {
        return self.colors[self.labels.indexOf(d.key)];
    };

    self.columnKey = function(d) {
        return self.labels[self.ids.indexOf(d.college)];
    };

    return self;
})();

var standing = (function() {
    var self = {
        labels: ['大學部', '研究生', '碩士生', '博士生', '交換/訪問生', '在職/進修生'],
        colors: ["#4caf50", "#00b8d4", "#00bcd4", "#0097a7", "#009688", "#cddc39"],
        ids: ['B', 'G', 'R', 'D', 'T', 'P'], /* B and G are generic identity types */
        shades: ["#aed581", "#9ccc65", "#8bc34a", "#4caf50", "#43a047", "#388e3c", "#2e7d32"]
    }

    self.coloring = function(d, thisYear) {
        var match = /B(\d{2})/g.exec(d.key);
        if (match) {
            var year = +(match[1]);
            year = Math.min(self.shades.length - 1, thisYear - ((year < 49 ? 100 : 0) + year));
            return self.shades[year];
        }
        else return self.colors[self.labels.indexOf(d.key)];
    };

    self.columnKey = function(d) {
        return (d.standing.length > 1 && d.standing.charAt(0) == 'B') ? ('大學部 ' + d.standing) : self.labels[self.ids.indexOf(d.standing)];
    };

    return self;
})();

var meta = {
    "103-1": {
        startTime: { hour: 9, minute: 0 },
        endTime: { hour: 19, minute: 0 },
        gap: 30,
        dimensions: ['station']
    },
    "103-2": {
        startTime: { hour: 9, minute: 0 },
        endTime: { hour: 19, minute: 0 },
        gap: 30,
        dimensions: ['station']
    },
    "104-1": {
        startTime: { hour: 9, minute: 0 },
        endTime: { hour: 19, minute: 0 },
        gap: 15,
        dimensions: ['station', 'college', 'standing']
    },
    "105-2": {
        startTime: { hour: 9, minute: 30 },
        endTime: { hour: 20, minute: 0 },
        gap: 15,
        dimensions: ['station', 'college', 'standing']
    }
};

function showData(semester, dimension) {
    var options = {
        dataPath: "data/"+semester+"/"+dimension+"-time.csv",
        startTime: meta[semester].startTime,
        endTime: meta[semester].endTime,
        gap: meta[semester].gap
    }

    if (dimension == 'station')
        options.column = function(d) { return d.station; };
    else if (dimension == 'college') {
        options.column = college.columnKey;
        options.colors = { stream: college.coloring, stacked: college.coloring };
    }
    else if (dimension == 'standing') {
        var year = +(semester.substr(0, 3));
        var coloring = function(d) { return standing.coloring(d, year); };
        options.column = standing.columnKey;
        options.colors = { stream: coloring, stacked: coloring };
    }

    return timeChart.initData(options);
}
