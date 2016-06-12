/**
 * Created by xlin on 11/06/16.
 */
'use strict';

var express = require('express'),
    https = require('https'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    queryString = require('query-string'),
    app = express();

require('dotenv').config();

app.set('trello api host', 'api.trello.com');

app.use(bodyParser.json());
router.post('/', function (req, res) {
    var issue = req.body;

    var cardData = {
            name: issue.project.name + ' - ' + issue.object_attributes.title,
            desc: issue.object_attributes.description + "\n" + issue.object_attributes.url
        };

    for (var queryKey in req.query) {
        cardData[queryKey] = req.query[queryKey];
    }
    
    createCard(cardData, function(err, data) {
        if(err) {
            res.sendStatus(500);
            res.end(err.message);
        } else {
            res.sendStatus(200);
            res.end(data);
        }
    });
});

function createCard(data, callback) {
    data.key = data.key || process.env.TRELLO_KEY;
    data.token = data.token || process.env.TRELLO_TOKEN;
    data.idList = data.list || process.env.TRELLO_LIST;
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
        var body='';
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

module.exports = router;
