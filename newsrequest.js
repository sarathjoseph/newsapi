     var http = require("http");
     var proc = require("./process");

     var news = function (options) {
             var str = '';

             http.get(options, function (response) {

                 response.on('data', function (chunk) {
                     str += chunk;


                 });
                 response.on('end', function () {

                     var obj = JSON.parse(str);
                     proc.extract(obj)

                 })
             }).on('error', function (e) {
                 console.log('problem with request: ' + e.message);
             })
         };

     exports.getNews = news;
