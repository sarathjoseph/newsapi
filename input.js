var item = new Array();
var merge = require("./merge");

var store = function (temp, Title, Section, Url, Id, Time) {
        var i;

        for (i = 0; i < temp.length; i++) {


            item[i] = {
                "Section": '',
                "Title": '',
                "Id": '',
                "Url": '',
                "Date": ''
            };
        }

        for (i = 0; i < temp.length; i++) {

            item[i]["Section"] = temp[i][Section];
            item[i]["Title"] = temp[i][Title];
            item[i]["Id"] = temp[i][Id];
            item[i]["Url"] = temp[i][Url];
            item[i]["Date"] = temp[i][Time];
        }

        merge.execute(item);
    }

exports.store = store;
