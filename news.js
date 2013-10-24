var http = require("http");
var url = require("url");
var api = require("./newsrequest");
var elem = require("./merge");
var url1 = "http://content.guardianapis.com/search?format=json&&api-key=s6gp4r8ab4mjsx5wc2eg8nkc&";
var url2 = "http://api.nytimes.com/svc/search/v2/articlesearch.json?&api-key=134400eb53266f45c0638dc4934118bc:3:68108648&"

function start(port) {

    http.createServer(function (req, res) {

        
        var pathname = url.parse(req.url).pathname;
        var query = url.parse(req.url).query;

        if (pathname === "/News/Search" && (query != null) && query.length > 2) {
            elem.init(req,res);
            var grd = url1 + query;
            var nyt = url2 + query;

            api.getNews(nyt);
            api.getNews(grd);
        } else res.end();

    }).listen(port);
    console.log("Waiting for HTTP requests");
}
exports.begin = start;
