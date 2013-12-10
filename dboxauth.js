       var crypto = require('crypto'),
           express = require('express'),
           request = require('request'),
           url = require('url');



       var app = express();
        //app.use(express.cookieParser());
       var dropbox = require('./dropbox-datastores-1.0-latest.js');
       




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

       function login(req, res) {


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
       }

       function dboxcallback(req, res) {


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
               now = new Date();
               console.log('Server Logged In: Token:' + token + 'UID:' + uid);


               // use the bearer token to make API calls
               request.get('https://api.dropbox.com/1/account/info', {
                   headers: {
                       Authorization: 'Bearer ' + token
                   }
               }, function (error, response, body) {
                   res.send('Server in successfully as ' + JSON.parse(body).display_name + '.');
               });
           });



       }


       exports.login = login;
       exports.callback = dboxcallback;