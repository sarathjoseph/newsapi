        require('newrelic');

        var express = require('express');
        var url = require('url');
        var app = express();
        var auth = require("./dboxauth.js");
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        var dropbox = require('./dropbox-datastores-1.0-latest.js');
        var APP_KEY = "mmddg539ftzuqi3";
        var APP_SECRET = "c0pv47qtjbrs96c";
        var token = "rniaypUH-3UAAAAAAAAAAUCpQtlaiSmYNQTcpMaAyhqhv0dgjueQ3z6QQWqCyrYT";
        var uid = "238652363";
        var https = require('https');
        var _io = require('socket.io');
        var http = require('http');
        var datastore;
        dbSetup();


        var server = http.createServer(app).listen(5000);
        var io = _io.listen(server, {
            log: false
        });


        function dbSetup() {


            var client = new dropbox.Client({
                "key": APP_KEY,
                "secret": APP_SECRET,
                "token": token,
                "uid": uid
            });

            var ds;
            client.getDatastoreManager().openDefaultDatastore(function (error, ds) {
                if (error) {
                    log('Error opening default datastore: ' + error);
                }
                datastore = ds;

            });


        }


        app.configure(function () {
            app.use(express.static(__dirname + '/public'));

            app.use(express.methodOverride());

            app.use(app.router);
        });




        app.post('/login', function (req, res) {

            res.setHeader('Content-Type', 'text/json');



            if (req.body.username && req.body.password) {


                var username = req.body.username;
                var password = req.body.password;

                var userTable = datastore.getTable("users");


                var results = userTable.query({
                    'user': username,
                    'password': password
                });
                if (results.length > 0) {

                    res.send({
                        "user": results[0].get("user")
                    });

                    console.log(results[0].get("user") + " logged in");

                } else {
                    res.send(403, 'Access denied');
                    log('Access denied');

                }




            } else {
                res.send(400, 'Invalid Parameters.');
                log('Save: Invalid Parameters.');
            }




        });


        app.post('/register', function (req, res) {


            if (req.body.username && req.body.password) {


                var username = req.body.username;
                var password = req.body.password;


                var userTable = datastore.getTable("users");


                var results = userTable.query({
                    'user': username
                });
                if (results.length > 0) {

                    res.send(400, 'User exists');
                    log('User Exists');


                } else {

                    userTable.insert({
                        "user": username,
                        "password": password
                    })

                    res.send({
                        "user": username
                    });
                    console.log("user " + username + " registered");


                }




            } else {
                res.send(400, 'Invalid Parameters.');
                log('Save: Invalid Parameters.');
            }




        });

        app.get('/admin/login', function (req, res) {

            auth.login(req, res);


        });

        app.get('/callback', function (req, res) {
            auth.callback(req, res);

        });

        app.get('/', function (req, res) {
            res.sendfile('./index.html');

        });

        function saveResponse(articles, query, callback) {

            var now = new Date();
            var response;
            log('Search "' + query + '" Sent to Dropbox');


            var searchTable = datastore.getTable('searches');

            var results = searchTable.query({
                "query": query
            });


            if (results.length < 1) {


                var search = searchTable.insert({
                    query: query,
                    date: new Date(),
                    data: JSON.stringify(articles)
                });

                now = new Date();
                log('Search "' + query + '" Saved. id:' + search.getId());

                response = {
                    id: search.getId(),
                    articles: articles
                };

            } else {

                results[0].set('data', JSON.stringify(articles));
                results[0].set('date', new Date());


                response = {

                    id: results[0].getId(),
                    articles: JSON.parse(results[0].get('data'))

                }


            }

            callback(response);

        }

        app.get('/query/:query', function (req, res) {

            if (req.params.query) {
                var query = req.params.query;
                res.setHeader('Content-Type', 'text/json');
                nyt = require('./newyorktimes');
                gua = require('./Guardian.js');
                log('Search "' + query + '" Received');

                var articles = new Array();
                nyt.getData(articles, query, function (query, articles) {
                    gua.getData(articles, query, function (query, articles) {
                        log('Response: ' + articles);
                        if (articles != '') {
                            saveResponse(articles, query, function (articles) {
                                res.setHeader('Content-Type', 'text/json');
                                res.send(articles);
                            });
                        } else {
                            res.send(404, 'Articles Not Found');
                            log('Articles Not Found');
                        }
                    });
                });
            } else {
                res.send(400, 'Bad Parameters');
                log('Search : Bad Parameters');
            }
        });


        app.post('/searches/save', function (req, res) {

            res.setHeader('Content-Type', 'text/json');



            if (req.body.index && req.body.folder && req.body.user) {

                var index = req.body.index;
                var folder = req.body.folder;
                var user = req.body.user;
                var id = req.body.id;

                log('Saving index:"' + index + '" of search "' + id + '"');


                var searchTable = datastore.getTable('searches');
                var search = searchTable.get(id);


                if (search != null) {

                    var searchData = JSON.parse(search.get('data'));

                    var articlesTable = datastore.getTable('articles');

                    var results = articlesTable.query({
                        "user": user,
                        "url": JSON.stringify(searchData[index]['url'])
                    });


                    if (results.length < 1) {
                        var article = articlesTable.insert({
                            folder: folder,
                            user: user,
                            date: new Date(),
                            url: JSON.stringify(searchData[index]['url'])
                        });

                        res.send("Index:'" + index + "' of search '" + id + "' saved");
                        log("Index:'" + index + "' of search '" + id + "' saved");
                    } else {

                        res.send(400, "URL already saved");
                        log("URL already saved");
                    }
                } else {
                    res.send(404, 'Search Id Not Found');
                    log('id:"' + id + 'Search Id Not Found');
                }


            } else {
                res.send(400, 'Invalid Parameters.');
                log('Save: Invalid Parameters.');
            }
        });




        app.get('/admin/docs', function (req, res) {
            log('Docs requested');
            var docs;
            var fs = require('fs');

            fs.readFile('./public/docs.txt', function (err, data) {
                if (err) {
                    throw err;
                }
                docs = data;
                res.write(docs);
                res.end();
            });
        });
        app.get('/searches', function (req, res) {
            var now = new Date();
            log('History was retrived');


            var searchTable = datastore.getTable('searches');
            var results = searchTable.query();
            var response = new Array();
            for (i = 0; i < results.length; i++) {
                //results[i].deleteRecord();
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

        app.get('/admin/delete/records/:table', function (req, res) {


            var table = req.params.table;


            var searchTable = datastore.getTable(table);
            var results = searchTable.query();

            for (i = 0; i < results.length; i++) {
                results[i].deleteRecord();
            }
            res.end(table + " Table records deleted");


        });

        app.get('/admin/delete/records/:table/:id', function (req, res) {


            var table = req.params.table;
            var id = req.params.id;



            datastore.getTable(table).get(id).deleteRecord();


            res.end(table + " record deleted");


        });

        app.get('/folders', function (req, res) {

            res.setHeader('Content-Type', 'text/json');
            log('Folders was retrived');

            var articlesTable = datastore.getTable('articles');
            var results = articlesTable.query();
            var response = new Array();

            for (i = 0; i < results.length; i++) {
                var folder = results[i].get('folder');
                if (response.indexOf(folder) == -1) {
                    response.push(folder);
                }
            }
            if (results.length != 0) {
                res.send(response);
            } else {
                res.send(404, 'No Folders Found');
            }

        });

        app.get('/folders/:id', function (req, res) {


            res.setHeader('Content-Type', 'text/json');
            var id = req.params.id;

            var articlesTable = datastore.getTable('articles');
            var results = articlesTable.query({
                folder: id
            });

            if (results.length != 0) {

                var response = new Array();
                for (i = 0; i < results.length; i++) {

                    var article = {
                        id: results[i].getId(),
                        date: results[i].get('date'),
                        user: results[i].get('user'),
                        article: results[i].get('url'),
                    };

                    response.push(article);
                }
                res.send(response);
            } else {
                res.send(404, 'Folder "' + id + '" Not Found');
            }


        });

        app.get('/folders/:id/users/:user', function (req, res) {


            res.setHeader('Content-Type', 'text/json');
            var id = req.params.id;
            var user = req.params.user;

            var articlesTable = datastore.getTable('articles');
            var results = articlesTable.query({
                folder: id,
                user: user,
            });

            if (results.length != 0) {

                var response = new Array();
                for (i = 0; i < results.length; i++) {

                    var article = {
                        id: results[i].getId(),
                        date: results[i].get('date'),
                        user: results[i].get('user'),
                        article: results[i].get('url'),
                    };

                    response.push(article);
                }
                res.send(response);
            } else {
                res.send(404, 'Folder "' + id + '" Not Found');
            }


        });



        app.get('/user/:user/favourites/', function (req, res) {

            var user = req.params.user;

            var articlesTable = datastore.getTable('articles');
            var results = articlesTable.query({
                user: user
            });

            if (results.length != 0) {

                var response = new Array();
                for (i = 0; i < results.length; i++) {

                    var article = {
                        date: results[i].get('date'),
                        article: results[i].get('url'),
                        folder: results[i].get('folder')
                    };

                    response.push(article);
                }
                res.send(response);
            } else {
                res.send(404, 'Folder for "' + user + '" Not Found');
            }
        });

        app.get('/docs', function(req, res){
            res.redirect('doc/index.html');
        });


        function log(msg) {
            var now = new Date();
            console.log(now.getHours() * 10000 + now.getMinutes() + now.getSeconds() + ' : ' + msg);
        }

        now = new Date();
        console.log(now.getHours() * 10000 + now.getMinutes() + now.getSeconds() + ': Server Started');