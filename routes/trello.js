/**
 * Created by xlin on 11/06/16.
 */
'use strict';

var express = require('express'),
    https = require('https'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    queryString = require('query-string'),
    mongo = require('mongodb').MongoClient,
    app = express();

require('dotenv').config();

var mongoUrl = process.env.MONGODB_URI;

app.set('trello api host', 'api.trello.com');

app.use(bodyParser.json());

router.get('/', function(req, res) {
    res.send('This hooks to Trello');
});

router.post('/', function (req, res) {
    mongo.connect(mongoUrl, function(err, db) {
        var collection = db.collection('headers');
        collection.insert(req.headers);
        db.close();
    })
    var type = req.headers['x-gitlab-event'],
        trelloKey = req.query.key || process.env.TRELLO_KEY,
        trelloToken = req.query.token || process.env.TRELLO_TOKEN,
        idList = req.query.list || process.env.TRELLO_LIST;

    if(!trelloKey || !trelloToken) {
        res.send('Invalid key or token');
        return;
    }

    if(!idList) {
        res.send('Please speficy List ID');
        return;
    }

    var handler = '';
    switch(type) {
        case 'Issue Hook':
            handler = handleIssue;
            break;
        default:
            res.send('Unknown request type');
            return;
    }

    handler(req, res);

    function handleIssue(req, res) {
        var issue = req.body,
            cardData = {
                key: trelloKey,
                token: trelloToken,
                idList: idList,
                name: issue.project.name + ' - ' + issue.object_attributes.title,
                desc: issue.object_attributes.description + "\n" + issue.object_attributes.url
            };
        
        createCard(cardData, function(err, data) {
            if(err) {
                res.send('Error: ' + err.message);
            } else {
                res.send(data);
            }
        });
    }

    function createCard(data, callback) {
        var formData = queryString.stringify(data);

        var options = {
                hostname: app.get('trello api host'),
                path: '/1/cards',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': formData.length
                }
            };

        var req = https.request(options, function(res) {
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                callback(null, body);
            });

            res.on('error', function(e) {
                callback(e, null);
            })
        });

        req.on('error', function(e) {
            callback(e, null);
        })

        req.write(formData);
        req.end();
    }

});


module.exports = router;
