var input = require("./input");
var clear = require("./merge");

var extract = function (obj) {

        if (obj["response"] != undefined) {

            if (typeof obj["response"]["meta"] === 'object') input.store(obj["response"]["docs"], "headline", "section_name", "web_url", "_id", "pub_date");
            else input.store(obj["response"]["results"], "webTitle", "sectionName", "webUrl", "id", "webPublicationDate");
        } else {
            clear.getResponse().end("Bad Request");
        }
    }


exports.extract = extract;