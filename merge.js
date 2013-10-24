var merged = new Array();
var counter = 0;
var response = {};
var request = {};

var url = require('url');

var execute = function (array) {
        counter++;
        merged = merged.concat(array);
        if (counter === 2) {
            console.log("Request received from: " + request.connection.remoteAddress + " with " + url.parse(request.url).query);
            response.write(JSON.stringify(merged));
            response.end();
        }
    }

var init = function (req, res) {
        merged = [];
        counter = 0;
        response = res;
        request = req;

    }

var res = function () {
        return response
    };

exports.execute = execute;
exports.init = init;
exports.getResponse = res;