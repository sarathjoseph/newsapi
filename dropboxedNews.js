var crypto = require('crypto'),
        express = require('express'),
        request = require('request'),
        url = require('url');


		
var app = express();
app.use(express.cookieParser());

var dropbox = require('./dropbox-datastores-1.0-latest.js');
var APP_KEY = 't9hj8x7whf52syq';
var APP_SECRET = 'y4ku3uomqxc0ecd';
var token;
var uid;

function generateCSRFToken() {
        return crypto.randomBytes(18).toString('base64')
                .replace(/\//g, '-').replace(/\+/g, '_');
}

function generateRedirectURI(req) {
        return url.format({
                        protocol: req.protocol,
                        host: req.headers.host,
                        pathname: app.path() + '/callback'
        });
}

app.get('/login', function (req, res) {
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

app.get('/callback', function (req, res) {
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
				
				log('Server Logged In: Token:'+token +'UID:'+uid);
							
				
                // use the bearer token to make API calls
                request.get('https://api.dropbox.com/1/account/info', {
                        headers: { Authorization: 'Bearer ' + token }
                }, function (error, response, body) {
                        res.send('Server in successfully as ' + JSON.parse(body).display_name + '.');
                });
        });
});

app.get('/search', function (req, res) {
	
	
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query.q;
	res.setHeader('Content-Type', 'text/json');
	nyt = require('./newyorktimes');
	
	log('Search "'+ query + '" Recived');

	nyt.getData(query, function (query, response) {
		saveResponse(query, response,function (response){
			res.write(JSON.stringify(response));
			res.end();	
		});		
	});
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

app.get('/searches/:id', function (req, res) {

	res.setHeader('Content-Type', 'text/json');
	var id = req.params.id;
	
    log('Retriving id:"'+ id + '"');
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
		res.send(JSON.parse(search.get('data')));		
		log('id:"'+ id + '" Fetch Completed.');
    });
});

app.get('/searches/:id/save/:index', function (req, res) {

	res.setHeader('Content-Type', 'text/json');
	var id = req.params.id;
	var index = req.params.index;
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
			date: new Date(),
			data: JSON.stringify(searchData[index])		
		});
		
		res.send('Index:"'+ index + '" of search "'+id+ '" Saved');		
		log('Index:"'+ index + '" of search "'+id+ '" Saved');
    });
});

app.get('/searches', function (req, res) {
	
    log('History was retrived');
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
        for (i = 0; i < results.length; i++) {
			
			var search = {
				id: results[i].getId(),
				date: results[i].get('date'),				
				query: results[i].get('query'),
				articles: JSON.parse(results[i].get('data'))			
			};
						
            response.push(search);
        }
		res.send(response);
        
    });
});


function log(msg){
	var now = new Date();
	console.log(now.getHours()*10000+now.getMinutes()+now.getSeconds() + ' : ' + msg);
}



app.listen(5000);
now = new Date();
console.log(now.getHours()*10000+now.getMinutes()+now.getSeconds()+': Server Started');
