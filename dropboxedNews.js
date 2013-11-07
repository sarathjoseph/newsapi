require('nodetime').profile({
    accountKey: '6cd4e0b1dd65c87991614cf404d53c90503551b3', 
    appName: 'NewsAPI'
  });

var crypto = require('crypto'),
        express = require('express'),
        request = require('request'),
        url = require('url');

var app = express();
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use('/doc', express.static(__dirname + '/doc'));

var dropbox = require('./dropbox-datastores-1.0.0.js');
var APP_KEY = 't9hj8x7whf52syq';
var APP_SECRET = 'y4ku3uomqxc0ecd';
var token = 'SNNdnCmv6V4AAAAAAAAAAVOQdVyA2VNbGfghKl0oVCEIhhrLMHTS_mkpN2qfXsPT';
var uid = '';

function generateCSRFToken() {
        return crypto.randomBytes(18).toString('base64')
                .replace(/\//g, '-').replace(/\+/g, '_');
}

function generateRedirectURI(req) {
        return url.format({
                        protocol: req.protocol,
                        host: req.headers.host,
                        pathname: app.path() + '/admin/callback'
        });
}

/**
 * @api {get} /admin/login Authenticates user
 * @apiversion 0.0.1
 * @apiName GetLogin
 * @apiGroup Authentication
 *
 * @apiDescription User can only login via the web. Use the provided URI to access the application via Dropbox.
 */
app.get('/admin/login', function (req, res) {
        var csrfToken = generateCSRFToken();
        res.cookie('csrf', csrfToken);
        res.redirect(url.format({
                protocol: 'https',
                hostname: 'www.dropbox.com',
                pathname: '1/oauth2/authorize',
                query: {
                        client_id: APP_KEY,
                        response_type: 'code',
                        state: csrfToken,
                        redirect_uri: generateRedirectURI(req)
                }
        }));
});

/**
 * @api {get} /admin/callback  Authentication callback
 * @apiversion 0.0.1
 * @apiName GetLoginCallback
 * @apiGroup Authentication
 *
 * @apiDescription Dropbox will callback to this URI to complete the login process within the API.
 */
app.get('/admin/callback', function (req, res) {
        if (req.query.error) {
                return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
        }

        //check CSRF token
        if (req.query.state !== req.cookies.csrf) {
               return res.status(401).send(
                       'CSRF token mismatch, possible cross-site request forgery attempt.'
               );
        }
        // exchange access code for bearer token
        request.post('https://api.dropbox.com/1/oauth2/token', {
                form: {
                        code: req.query.code,
                        grant_type: 'authorization_code',
                        redirect_uri: generateRedirectURI(req)
                },
                auth: {
                        user: APP_KEY,
                        pass: APP_SECRET
                }
        }, function (error, response, body) {
                var data = JSON.parse(body);

                if (data.error) {
                        return res.send('ERROR: ' + data.error);
                }

                // extract bearer token
                token = data.access_token;
				uid = data.uid;
				
				log('Server Logged In');
				log('Token : '+ token );
				log('UID   : '+ uid);
							
                // use the bearer token to make API calls
                request.get('https://api.dropbox.com/1/account/info', {
                        headers: { Authorization: 'Bearer ' + token }
                }, function (error, response, body) {
                        res.send('Logged in successfully as ' + JSON.parse(body).display_name + '.');
                });
        });
});

/**
 * @api {get} /query/:query Queries news sources and returns results from these sources.
 * @apiversion 0.0.1
 * @apiName GetQuery
 * @apiGroup Query
 *
 * @apiParam {String} query A specific query.
 *
 * @apiSuccess {String} id Identifier of the search query.
 * @apiSuccess {String[]} articles Articles with results in JSON.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *			"id": "_17ahev6k9i0_js_kUa2d",
 *		  	"articles": [
 *		    {
 *		      "url": "http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html",
 *		      "source": "The New York Times",
 *		      "headline": "In Rodriguez Arbitration, Two Sides Play Hardball",
 *		      "snippet": "In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.",
 *		      "pub_date": "2013-11-04T00:00:00Z",
 *		      "section_name": "Sports",
 *		      "type_of_material": "News"
 *		    },
 *		    {
 *		      "url": "http://select.nytimes.com/gst/abstract.html?res=9D03E0DC1531E63ABC4952DFBE66838C649EDE",
 *		      "source": "The New York Times",
 *		      "headline": "Major Sports News",
 *		      "snippet": "Don Drysdale pitched a sevenhitter yesterday as the Dodgers shut out the Pirates, 3 to 0. The Yankees defeated the Orioles,...",
 *		      "pub_date": "1957-08-11T00:00:00Z",
 *		      "section_name": null,
 *		      "type_of_material": "Front Page"
 *		    },
 *		    {
 *		      "url": "http://www.nytimes.com/1985/11/15/sports/transactions-156837.html",
 *		      "source": "The New York Times",
 *		      "headline": "Transactions",
 *		      "snippet": "  BOSTON (AL) -Released Jim Dorsey, pitcher. Assigned Dave Sax, catcher, and LaSchelle Tarver and Gus Burgess, outfielders, to Pawtucket of the International League.",
 *		      "pub_date": "1985-11-15T00:00:00Z",
 *		      "section_name": "Sports",
 *		      "type_of_material": "List"
 *		    },
 *		    ...
 *     }
 *
 * @apiError ArticlesNotFound The articles were not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "Articles Not Found"
 *     }
 *
 * @apiError BadParameters Search used bad parameters.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Content
 *     {
 *       "Bad Parameters"
 *     }
 */
app.get('/query/:query', function (req, res) {

	
	
	if (req.params.query){
		var query = req.params.query;
		res.setHeader('Content-Type', 'text/json');
		nyt = require('./newyorktimes');
		
		log('Search "'+ query + '" Received');

		nyt.getData(query, function (query, response) {
			log('Response: '+response);
			if (response != ''){
				saveResponse(query, response,function (response){
					res.setHeader('Content-Type', 'text/json');
					res.send(response);				
				});
			}else{
				res.send(404, 'Articles Not Found');			
				log('Articles Not Found');
			}			
		});
	}else{
		res.send(400, 'Bad Parameters');			
		log('Search : Bad Parameters');
	}
});

function saveResponse(query, articles, callback){
	var client = new dropbox.Client
				({
					key: APP_KEY,
					secret: APP_SECRET,
					token: token,
					uid:uid
				});		
				
	
	log('Search "' + query +'" Sent to Dropbox');
	
	var datastoreManager = client.getDatastoreManager();
	datastoreManager.openDefaultDatastore(function (error, datastore) {
		if (error) {
			 
			 log('Error opening default datastore: ' + error);
		}					
		
		var searchTable = datastore.getTable('searches');
		
		var search = searchTable.insert({
			query: query,
			date: new Date(),
			data: JSON.stringify(articles)			
		});
		
		
		log('Search "' + query +'" Saved. id:'+search.getId());
		
		var response = {
			id: search.getId(),
			articles: articles		
		};
		
		callback(response);
		
	});	
}


/**
 * @api {get} /searches Returns a list of searches
 * @apiversion 0.0.1
 * @apiName GetSearches
 * @apiGroup Search
 *
 * @apiSuccess {String} id Identifier of the search query.
 * @apiSuccess {String[]} data Data returned as stored results.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *			"id": "_17ahd0srgi0_js_GXaeN",
 *   		"data": {
 *     			"date": "2013-11-07T00:22:12.200Z",
 *     			"query": "baseball",
 *     			"articles": [
 *       		{
 *         			"url": "http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html",
 *         			"source": "The New York Times",
 *         			"headline": "In Rodriguez Arbitration, Two Sides Play Hardball",
 *         			"snippet": "In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.",
 *         			"pub_date": "2013-11-04T00:00:00Z",
 *         			"section_name": "Sports",
 *         			"type_of_material": "News"
 *       		},
 *       		...
 *       	}
 *     }
 *
 * @apiError NoSearchesFound There are no searches stored.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "No searches found"
 *     }
 */
app.get('/searches', function (req, res) {
	
	res.setHeader('Content-Type', 'text/json');
    log('Searches was retrived');
    var client = new dropbox.Client
                ({
                    key: APP_KEY,
                    secret: APP_SECRET,
                    token: token,
                    uid:uid
                });        

    var datastoreManager = client.getDatastoreManager();
    datastoreManager.openDefaultDatastore(function (error, datastore) {
        if (error) {
             log('Error opening default datastore: ' + error);
        }                    
        
        var searchTable = datastore.getTable('searches');
        var results = searchTable.query();
		var response = new Array();
		if (results.length != 0){
			for (i = 0; i < results.length; i++) {
				
				var search = {
					id: results[i].getId(),
					data:{
						date: results[i].get('date'),				
						query: results[i].get('query'),
						articles: JSON.parse(results[i].get('data'))
					}				
				};
							
				response.push(search);
			}
			res.send(response);
		}else{
			res.send(404, 'No searches found');			
			log('id:"'+ id + 'No searches found');
		}        
    });
});

/**
 * @api {get} /searches/:id Returns a specific result from a search
 * @apiversion 0.0.1
 * @apiName GetSearchesWithId
 * @apiGroup Search
 *
 * @apiParam {String} id A specific identifier.
 *
 * @apiSuccess {String[]} N/A Search result in form of JSON.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *			{
 *		    	"url": "http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html",
 *		    	"source": "The New York Times",
 *		    	"headline": "In Rodriguez Arbitration, Two Sides Play Hardball",
 *		    	"snippet": "In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.",
 *		    	"pub_date": "2013-11-04T00:00:00Z",
 *		    	"section_name": "Sports",
 *		    	"type_of_material": "News"
 *			},
 *     }
 *
 * @apiError SearchIdNotFound Search results cannot be found with the id provided.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "Search Id Not Found"
 *     }
 */
app.get('/searches/:id', function (req, res) {

	res.setHeader('Content-Type', 'text/json');
	var id = req.params.id;
	
    log('Retrieving id:"'+ id + '"');

    var client = new dropbox.Client
                ({
                    key: APP_KEY,
                    secret: APP_SECRET,
                    token: token,
                    uid:uid
                });        

    var datastoreManager = client.getDatastoreManager();
    datastoreManager.openDefaultDatastore(function (error, datastore) {
        if (error) {
             log('Error opening default datastore: ' + error);
        }                    
        
        var searchTable = datastore.getTable('searches');
        var search = searchTable.get(id);
		
		if (search != null){
			res.send(JSON.parse(search.get('data')));		
			log('id:"'+ id + '" Fetch Completed.');
		}else{
			res.send(404, 'Search Id Not Found');	
			log('id:"'+ id + 'Search Id Not Found');
		}
    });
});

/**
 * @api {post} /searches/:id Saves a specific index (result) to a folder from a specific query
 * @apiversion 0.0.1
 * @apiName SaveResult
 * @apiGroup Save
 *
 * @apiParam {String} id A specific identifier.
 * @apiParam {Number} index Position of article in question.
 * @apiParam {String} folder Name of folder.
 *
 * @apiSuccess {String} Confirmation of saved index in specified folder
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *			"Index: '2' of search '_17ahd0srgi0_js_GXae' saved"
 *     }
 *
 * @apiError SearchIdNotFound Search results cannot be found with the id provided.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "Search Id Not Found"
 *     } 
 *
 * @apiError InvalidParameters Invalid Index or Folder Parameters.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad request
 *     {
 *       "Invalid Parameters"
 *     }
 */
app.post('/searches/:id', function (req, res) {

	res.setHeader('Content-Type', 'text/json');
	
	var id = req.params.id;
	
	if (req.body.index && req.body.folder){
	
		var index = req.body.index;
		var folder = req.body.folder;

		log('Saving index:"'+ index + '" of search "'+id+ '"');
		
		var client = new dropbox.Client
					({
						key: APP_KEY,
						secret: APP_SECRET,
						token: token,
						uid:uid
					});        

		var datastoreManager = client.getDatastoreManager();
		datastoreManager.openDefaultDatastore(function (error, datastore) {
			if (error) {
				 log('Error opening default datastore: ' + error);
			}                    
			
			var searchTable = datastore.getTable('searches');
			var search = searchTable.get(id);
			
			
			if (search != null){
			
				var searchData = JSON.parse(search.get('data'));

				var articlesTable = datastore.getTable('articles');
				
				var article = articlesTable.insert({
					folder: folder,
					date: new Date(),
					url: JSON.stringify(searchData[index]['url'])
				});
				
				res.send("Index:'"+ index + "' of search '"+id+ "' saved");		
				log("Index:'"+ index + "' of search '"+id+ "' saved");

			}else{
				res.send(404, 'Search Id Not Found');	
				log('id:"'+ id + 'Search Id Not Found');
			}
		
		});
	}else{
			res.send(400 , 'Invalid Parameters.');	
			log('Save: Invalid Parameters.');
		}
});


/**
 * @api {get} /folders Returns a list of folders
 * @apiversion 0.0.1
 * @apiName GetFolders
 * @apiGroup Folders
 *
 * @apiSuccess {String[]} data Results within a specific folder in form of JSON.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *			[
 *			  	"Web",
 *			  	"Internet",
 *			  	"News",
 *			  	"Informations"
 *			]
 *     }
 *
 * @apiError NoFoldersFound There are no folders found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "No Folders found"
 *     }
 */
app.get('/folders', function (req, res) {

	res.setHeader('Content-Type', 'text/json');
    log('History was retrieved');

    var client = new dropbox.Client
                ({
                    key: APP_KEY,
                    secret: APP_SECRET,
                    token: token,
                    uid:uid
                });        

    var datastoreManager = client.getDatastoreManager();
    datastoreManager.openDefaultDatastore(function (error, datastore) {
        if (error) {
             log('Error opening default datastore: ' + error);
        }                    

        var articlesTable = datastore.getTable('articles');
        var results = articlesTable.query();
		var response = new Array();
		
        for (i = 0; i < results.length; i++) {			
			var folder = results[i].get('folder');
			if(response.indexOf(folder) == -1){
				response.push(folder);
			}
        }
		if (results.length != 0){
			res.send(response);
        }else{
			res.send(404, 'No Folders Found');
		}
    });
});

/**
 * @api {get} /folders/:id Returns results from a specific folder
 * @apiversion 0.0.1
 * @apiName GetFoldersWithId
 * @apiGroup Folders
 *
 * @apiParam {String} id A specific identifier.
 *
 * @apiSuccess {String} date Date of article.
 * @apiSuccess {String} article URL of article.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *	   {
 *  		"date": "2013-10-31T09:32:03.999Z",
 *  		"article": "http://health.nytimes.com/health/guides/disease/hodgkins-lymphoma/overview.html"
 *		}
 *
 * @apiError NoSearchesFound There are no searches stored.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "Folder '3' Not Found"
 *     }
 */
app.get('/folders/:id', function (req, res) {
	

	res.setHeader('Content-Type', 'text/json');
	var id = req.params.id;
	
    var client = new dropbox.Client
                ({
                    key: APP_KEY,
                    secret: APP_SECRET,
                    token: token,
                    uid:uid
                });        

    var datastoreManager = client.getDatastoreManager();
    datastoreManager.openDefaultDatastore(function (error, datastore) {
        if (error) {
             log('Error opening default datastore: ' + error);
        }                    
        
        var articlesTable = datastore.getTable('articles');
        var results = articlesTable.query({folder:id});
		
		if (results.length != 0){
		
			var response = new Array();
			for (i = 0; i < results.length; i++) {	
			
				var article = {
					date: results[i].get('date'),
					article: JSON.parse(results[i].get('url'))							
				};
							
				response.push(article);
			}
			res.send(response);
		}else {
			res.send(404, "Folder '"+id+"' Not Found");
		}
        
    });
});

app.get('/docs', function(req, res){
	res.redirect('doc/index.html');
});

/**
 * @api {get} / Base API URI
 * @apiversion 0.0.1
 * @apiName GetBase
 * @apiGroup General
 *
 * @apiError BadRequest There's nothing here.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *     }
 */
app.get('/', function(req, res){
	res.send(400);
});

function log(msg){
	var now = new Date();
	console.log((1000000+(now.getHours()*10000 + now.getMinutes()*100 + now.getSeconds())).toString().substring(1,7) + ' : ' + msg);
}

var port = process.env.PORT || 5000;
app.listen(port);

log('Server Started');
