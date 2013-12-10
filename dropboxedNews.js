        require('newrelic');

        var express = require('express');
        var url = require('url');
        var app = express();
        var auth = require("./dboxauth.js");
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use('/doc', express.static(__dirname + '/doc'));
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


        // app.configure(function () {
        //     app.use(express.static(__dirname + '/public'));

        //     app.use(express.methodOverride());

        //     app.use(app.router);
        // });



        /**
         * @api {post} /login Authenticates user
         * @apiversion 0.0.2
         * @apiName PostLogin
         * @apiGroup Authentication
         *
         * @apiParam {String} username Username
         * @apiParam {String} password Password
         *
         * @apiSuccess {String} user Username
         *
         * @apiSuccessExample Success-Response:
         *  HTTP/1.1 200 OK
         *  {
         *      "user": "test"
         *  }      
         *
         * @apiError AccessDenied Access is denied -- wrong username / password
         *
         * @apiErrorExample Error-Response:
         *  HTTP/1.1 403 Forbidden
         *  {
         *     "Access denied"
         *  }
         *
         * @apiDescription Login user
         */
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

        /**
         * @api {post} /register Register user
         * @apiversion 0.0.2
         * @apiName PostRegister
         * @apiGroup Authentication
         *
         * @apiParam {String} username Username
         * @apiParam {String} password Password
         *
         * @apiSuccess {String} user Username
         *
         * @apiSuccessExample Success-Response:
         *  HTTP/1.1 200 OK
         *  {
         *      "user": "test"
         *  }      
         *
         * @apiError UserExists User already exists in the database
         *
         * @apiErrorExample Error-Response:
         *  HTTP/1.1 400 Bad Content
         *  {
         *     "User Exists"
         *  }
         *
         * @apiError InvalidParams Parameters supplied were invalid
         *
         * @apiErrorExample Error-Response:
         *  HTTP/1.1 400 Bad Content
         *  {
         *     "Invalid Parameters."
         *  }
         *
         * @apiDescription Registers user
         */
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


        /**
         * @api {get} /admin/login Authenticates admin
         * @apiversion 0.0.2
         * @apiName GetAdminLogin
         * @apiGroup Admin
         *
         * @apiDescription Admin login
         */
        app.get('/admin/login', function (req, res) {

            auth.login(req, res);

        });

        /**
         * @api {get} /callback  Dropbox authentication callback
         * @apiversion 0.0.2
         * @apiName GetDropboxCallback
         * @apiGroup Authentication
         *
         * @apiDescription Dropbox will callback to this URI to continue working with the API.
         */
        app.get('/callback', function (req, res) {
            auth.callback(req, res);
        });

        /**
         * @api {get} / Base API URI
         * @apiversion 0.0.2
         * @apiName GetBase
         * @apiGroup General
         *
         * @apiDescription Basic page showing all folders and searches
         */
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

        /**
         * @api {get} /query/:query Queries news sources and returns results from these sources.
         * @apiversion 0.0.2
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
         *          "id": "_17ahev6k9i0_js_kUa2d",
         *          "articles": [
         *          {
         *            "url": "http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html",
         *            "source": "The New York Times",
         *            "headline": "In Rodriguez Arbitration, Two Sides Play Hardball",
         *            "snippet": "In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.",
         *            "pub_date": "2013-11-04T00:00:00Z",
         *            "section_name": "Sports",
         *            "type_of_material": "News"
         *          },
         *          {
         *            "url": "http://select.nytimes.com/gst/abstract.html?res=9D03E0DC1531E63ABC4952DFBE66838C649EDE",
         *            "source": "The New York Times",
         *            "headline": "Major Sports News",
         *            "snippet": "Don Drysdale pitched a sevenhitter yesterday as the Dodgers shut out the Pirates, 3 to 0. The Yankees defeated the Orioles,...",
         *            "pub_date": "1957-08-11T00:00:00Z",
         *            "section_name": null,
         *            "type_of_material": "Front Page"
         *          },
         *          {
         *            "url": "http://www.nytimes.com/1985/11/15/sports/transactions-156837.html",
         *            "source": "The New York Times",
         *            "headline": "Transactions",
         *            "snippet": "  BOSTON (AL) -Released Jim Dorsey, pitcher. Assigned Dave Sax, catcher, and LaSchelle Tarver and Gus Burgess, outfielders, to Pawtucket of the International League.",
         *            "pub_date": "1985-11-15T00:00:00Z",
         *            "section_name": "Sports",
         *            "type_of_material": "List"
         *          },
         *          ...
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
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
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


        /**
         * @api {post} /searches/save Saves a specific search result by id into a folder for the logged in user
         * @apiversion 0.0.2
         * @apiName PostSearchSave
         * @apiGroup Query
         *
         * @apiParam {String} user The logged in user
         * @apiParam {String} index Location in folder
         * @apiParam {String} folder Name of folder to store results in
         * @apiParam {String} id Id of article
         *
         * @apiSuccessExample Success-Response:
         *     HTTP/1.1 200 OK
         *     {
         *         "Index:'3' of search '_17d4oe6o278_js_xM0uG' saved"
         *     }
         *
         * @apiError URLAlreadySaved URL is already saved in a folder
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 400 Bad Content
         *     {
         *       "URL already saved"
         *     }
         *
         * @apiError SearchIdNotFound Cannot find search results to store.
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 404 Not Found
         *     {
         *       "Search Id Not Found"
         *     }
         *
         * @apiError InvalidParams Parameters supplied were invalid
         *
         * @apiErrorExample Error-Response:
         *  HTTP/1.1 400 Bad Content
         *  {
         *     "Invalid Parameters."
         *  }
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
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

        // app.get('/admin/docs', function (req, res) {
        //     log('Docs requested');
        //     var docs;
        //     var fs = require('fs');

        //     fs.readFile('./public/docs.txt', function (err, data) {
        //         if (err) {
        //             throw err;
        //         }
        //         docs = data;
        //         res.write(docs);
        //         res.end();
        //     });
        // });

        /**
         * @api {get} /searches Returns a list of searches
         * @apiversion 0.0.2
         * @apiName GetSearches
         * @apiGroup Search
         *
         * @apiSuccess {String} id Identifier of the search query.
         * @apiSuccess {String[]} data Data returned as stored results.
         *
         * @apiSuccessExample Success-Response:
         *     HTTP/1.1 200 OK
         *     {
         *          "id": "_17ahd0srgi0_js_GXaeN",
         *          "data": {
         *              "date": "2013-11-07T00:22:12.200Z",
         *              "query": "baseball",
         *              "articles": [
         *              {
         *                  "url": "http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html",
         *                  "source": "The New York Times",
         *                  "headline": "In Rodriguez Arbitration, Two Sides Play Hardball",
         *                  "snippet": "In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.",
         *                  "pub_date": "2013-11-04T00:00:00Z",
         *                  "section_name": "Sports",
         *                  "type_of_material": "News"
         *              },
         *              ...
         *          }
         *     }
         *
         * @apiError NoSearchesFound There are no searches stored.
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 404 Not Found
         *     {
         *       "No searches found"
         *     }
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
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

        /**
         * @api {get} /admin/delete/records/:table Deletes table records
         * @apiversion 0.0.2
         * @apiName GetDeleteTableRecords
         * @apiGroup Admin
         *
         * @apiSuccess {String} table Table name.
         *
         * @apiSuccessExample Success-Response:
         *     HTTP/1.1 200 OK
         *     {
         *          "test Table records deleted"
         *     }
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
        app.get('/admin/delete/records/:table', function (req, res) {


            var table = req.params.table;


            var searchTable = datastore.getTable(table);
            var results = searchTable.query();

            for (i = 0; i < results.length; i++) {
                results[i].deleteRecord();
            }
            res.end(table + " Table records deleted");


        });

        /**
         * @api {get} /admin/delete/records/:table/:id Deletes table records with a specific id
         * @apiversion 0.0.2
         * @apiName GetDeleteTableRecordsWithId
         * @apiGroup Admin
         *
         * @apiSuccess {String} table Table name.
         * @apiSuccess {String} id A specific identifier.
         *
         * @apiSuccessExample Success-Response:
         *     HTTP/1.1 200 OK
         *     {
         *          "test record deleted"
         *     }
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
        app.get('/admin/delete/records/:table/:id', function (req, res) {


            var table = req.params.table;
            var id = req.params.id;



            datastore.getTable(table).get(id).deleteRecord();


            res.end(table + " record deleted");


        });

        /**
         * @api {get} /folders Returns a list of folders
         * @apiversion 0.0.2
         * @apiName GetFolders
         * @apiGroup Folders
         *
         * @apiSuccess {String[]} data Results within a specific folder in form of JSON.
         *
         * @apiSuccessExample Success-Response:
         *     HTTP/1.1 200 OK
         *     {
         *     }
         *
         * @apiError NoFoldersFound There are no folders found.
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 404 Not Found
         *     {
         *       "No Folders found"
         *     }
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
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

        /**
         * @api {get} /folders/:id Returns results from a specific folder
         * @apiversion 0.0.2
         * @apiName GetFoldersWithId
         * @apiGroup Folders
         *
         * @apiParam {String} id A specific identifier.
         *
         * @apiSuccess {String[]} data Results within a specific folder in form of JSON.
         *
         * @apiSuccessExample Success-Response:
         *      HTTP/1.1 200 OK
         *      {
         *          "id": "_17d4ognvln8_js_qWs97",
         *          "date": "2013-12-10T03:58:53.409Z",
         *          "user": "test",
         *          "article": "\"http://select.nytimes.com/gst/abstract.html?res=9900E6D6163EEE3BBC4950DFB667838D629EDE\""
         *      }
         *
         * @apiError FolderNotFound Folder not found.
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 404 Not Found
         *     {
         *       "Folder '3' Not Found"
         *     }
         *
         * @apiDescription Queries news sources and returns results from these sources.
         */
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

        /**
         * @api {get} /folders/:id/users/:user Returns results from a specific folder stored by a user
         * @apiversion 0.0.2
         * @apiName GetFoldersWithIdWithUser
         * @apiGroup Folders
         *
         * @apiParam {String} id A specific identifier.
         * @apiParam {String} user A specific user.
         *
         * @apiSuccess {String[]} data Results within a specific folder in form of JSON.
         *
         * @apiSuccessExample Success-Response:
         *      HTTP/1.1 200 OK
         *      {
         *          "id": "_17d4ognvln8_js_qWs97",
         *          "date": "2013-12-10T03:58:53.409Z",
         *          "user": "test",
         *          "article": "\"http://select.nytimes.com/gst/abstract.html?res=9900E6D6163EEE3BBC4950DFB667838D629EDE\""
         *      }
         *
         * @apiError FolderNotFound Folder not found.
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 404 Not Found
         *     {
         *       "Folder '3' Not Found"
         *     }
         *
         * @apiDescription Results are shown from a specific folder
         */
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


        /**
         * @api {get} /user/:user/favourites Returns user's saved searches as favourites
         * @apiversion 0.0.2
         * @apiName GetUserFavourites
         * @apiGroup Ussr
         *
         * @apiParam {String} user A specific user.
         *
         * @apiSuccess {String[]} data Results within a specific folder in form of JSON.
         *
         * @apiSuccessExample Success-Response:
         *      HTTP/1.1 200 OK
         *      {
         *          "date": "2013-12-10T03:58:53.409Z",
         *          "article": "\"http://select.nytimes.com/gst/abstract.html?res=9900E6D6163EEE3BBC4950DFB667838D629EDE\"",
         *          "folder": "sports"
         *      }
         *
         * @apiError FolderNotFound User's folder not found.
         *
         * @apiErrorExample Error-Response:
         *     HTTP/1.1 404 Not Found
         *     {
         *       "Folder for 'test' Not Found"
         *     }
         *
         * @apiDescription Show all favourites for a specifc users
         */
        app.get('/user/:user/favourites', function (req, res) {

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

        /**
         * @api {get} /docs API Documentation
         * @apiversion 0.0.2
         * @apiName GetDocs
         * @apiGroup General
         *
         * @apiDescription Documentation about the API including success results and errors.
         */
        app.get('/docs', function(req, res){
            res.redirect('doc/index.html');
        });


        function log(msg) {
            var now = new Date();
            console.log(now.getHours() * 10000 + now.getMinutes() + now.getSeconds() + ' : ' + msg);
        }

        now = new Date();
        console.log(now.getHours() * 10000 + now.getMinutes() + now.getSeconds() + ': Server Started');