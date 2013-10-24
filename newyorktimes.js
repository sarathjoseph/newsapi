var     request = require('request'),
        url = require('url');


var		NTY_API_KEY = 'c3a958f43f94d1d39a6228faa8fe483b:11:68109101';
var		response;
		
var getData = function (q,res,callback) {
		response = res;
        request.get('http://api.nytimes.com/svc/search/v2/articlesearch.json?q='+q+'&api-key='+NTY_API_KEY, function (error, response, body) {
						
                        parse(body,res,callback);
						
                });				
}

function parse(response,res,callback) {
        jsonObject = JSON.parse(response);		
		articles = jsonObject["response"]["docs"];
		parsedArticles = new Array();		
		
		for (i = 0; i < articles.length; i++) {
            parsedArticle = {
				"index":i, 
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
		
		callback(JSON.stringify(parsedArticles));
}



exports.getData = getData;