// (C) NTUOSC 2014

var colors = ['f44336', 'ff5722', 'ffc107', '4caf50', '2196f3', '3f51b5', '9c27b0', '00bcd4', '009688', 'e91e63'];

function from_hex(b) {
    var conv_table = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15 }
    return conv_table[b[0]] * 16 + conv_table[b[1]];
}

function color_to_rgba(color, alpha) {
    return 'rgba(' + from_hex(color.substring(1,3)) + ',' + from_hex(color.substring(3,5)) + ',' + from_hex(color.substring(5,7)) + ',' + alpha +')';
}

function generate_dataset(data) {
    var dataset = [];
    var color_index = 0;
    for (var i in data) {
        var color = '#' + colors[color_index];
        dataset.push({
            label: i,
            data: data[i],
            fillColor: color_to_rgba(color, .2),
            strokeColor: color,
            pointColor: color,
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: color,
        });
        color_index++;
    }
    return dataset;
}

function generate_flat_dataset(data, labels) {
    var dataset = [];
    var color_index = 0;
    for (var i in data) {
        var color = '#' + colors[color_index];
        dataset.push({
            label: (labels ? labels[i] : i),
            value: data[i],
            color: color,
            highlight: color_to_rgba(color, .87),
        });
        color_index++;
    }
    return dataset;
}
