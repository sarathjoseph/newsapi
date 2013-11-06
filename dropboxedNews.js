var crypto = require('crypto'),
        express = require('express'),
        request = require('request'),
        url = require('url');

var app = express();
app.use(express.cookieParser());

var dropbox = require('./dropbox-datastores-1.0.0.js');
var APP_KEY = 't9hj8x7whf52syq';
var APP_SECRET = 'y4ku3uomqxc0ecd';
var token = 'YHd3kwx_9b4AAAAAAAAAAaceJyXlAkZECcOeX2Q8A9hE2rXot7R2jzs-rY9_ln6-';
var uid = '91667051';

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
                        res.send('Server in successfully as ' + JSON.parse(body).display_name + '.');
                });
        });
});

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

app.get('/searches/:id/save/:index/:folder', function (req, res) {

	res.setHeader('Content-Type', 'text/json');
	
	var id = req.params.id;
	var index = req.params.index;
	var folder = req.params.folder;

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
		var searchData = JSON.parse(search.get('data'));

		var articlesTable = datastore.getTable('articles');
		
		var article = articlesTable.insert({
			folder: folder,
			date: new Date(),
			url: JSON.stringify(searchData[index]['url'])
		});
		
		res.send('Index:"'+ index + '" of search "'+id+ '" Saved');		
		log('Index:"'+ index + '" of search "'+id+ '" Saved');
    });
});

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
					article: JSON.parse(results[i].get('data'))['url']								
				};
							
				response.push(article);
			}
			res.send(response);
		}else {
			res.send(404, 'Folder "'+id+'" Not Found');
		}
        
    });
});

function log(msg){
	var now = new Date();
	console.log(now.getHours()*10000+now.getMinutes()+now.getSeconds() + ' : ' + msg);
}

var port = process.env.PORT || 5000;
app.listen(port);

now = new Date();
console.log(now.getHours()*10000+now.getMinutes()+now.getSeconds()+': Server Started');
