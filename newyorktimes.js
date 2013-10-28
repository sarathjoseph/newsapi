var     request = require('request'),
        url = require('url');


var		NTY_API_KEY = 'c3a958f43f94d1d39a6228faa8fe483b:11:68109101';
var		response;
		
var getData = function (query,callback) {
		
        request.get('http://api.nytimes.com/svc/search/v2/articlesearch.json?q='+query+'&api-key='+NTY_API_KEY, function (error, response, body) {
						
                        parse(query,body,callback);
						
                });				
}

function parse(query,response,callback) {
        jsonObject = JSON.parse(response);		
		articles = jsonObject["response"]["docs"];
		parsedArticles = new Array();		
		
		for (i = 0; i < articles.length; i++) {
            parsedArticle = {
                "url": articles[i]['web_url'],
                "source": articles[i]['source'],
                "headline": articles[i]['headline']['main'],
                "snippet": articles[i]['snippet'],
                "pub_date": articles[i]['pub_date'],
                "section_name": articles[i]['section_name'],
                "type_of_material": articles[i]['type_of_material'],
            };
			parsedArticles.push(parsedArticle);
        }		
		
		callback(query, parsedArticles);
}



exports.getData = getData;