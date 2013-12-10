var     request = require('request'),
        url = require('url');


var     GRD_API_KEY = 's6gp4r8ab4mjsx5wc2eg8nkc';
var     response;
var     parsedArticles;
        
var getData = function (articles,query,callback) {
        parsedArticles = articles;
        request.get('http://content.guardianapis.com/search?format=json&show-fields=all&q='+query+'&api-key='+GRD_API_KEY, function (error, response, body) {
                       // console.log(response);
                        parse(query,body,callback);
                        
                });              
}

function parse(query,response,callback) {
        var jsonObject = JSON.parse(response);      
        var articles = jsonObject["response"]["results"];
            
        
        for (i = 0; i < articles.length; i++) {
            parsedArticle = {
                "url": articles[i]['webUrl'],
                "source": articles[i]['fields']['publication'],
                "headline": articles[i]['webTitle'],
                "snippet": articles[i]['fields']['standfirst'],
                "pub_date": articles[i]['webPublicationDate'],
                "section_name": articles[i]['sectionName'],
                "type_of_material": (function(){if(articles[i]['webUrl'].indexOf("blog")==-1){return "News"} else{return "Blog"}}())
            };
            parsedArticles.push(parsedArticle);
        }       
        
        callback(query, parsedArticles);
}



exports.getData = getData;