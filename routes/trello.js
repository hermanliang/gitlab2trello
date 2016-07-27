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
    
var Trello = require("trello");

require('dotenv').config();

var mongoUrl = process.env.MONGODB_URI;

app.set('trello api host', 'api.trello.com');

app.use(bodyParser.json());

router.get('/', function(req, res) {
    res.send('This hooks to Trello');
});

router.post('/', function (req, res) {
    if(process.env.MODE === 'DEBUG') {
        var mongo = require('mongodb').MongoClient;
        mongo.connect(mongoUrl, function(err, db) {
            var collection = db.collection('issues');
            collection.insert({headers: req.headers, body: req.body});
            db.close();
        });
    }

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
                name: issue.object_attributes.title + ' (#' + issue.object_attributes.iid + ') · Issues · '
                    + issue.project.namespace + ' / ' + issue.project.name
                    + ' GitLab',
                desc: issue.object_attributes.description + "\n" + issue.object_attributes.url,
                url: issue.object_attributes.url
            };
        
        console.log(issue);
        
        if(issue.object_attributes.action === 'open') {
            createCard(cardData, function(err, data) {
                if(err) {
                    res.send('Error: ' + err.message);
                } else {
                    res.send(data);
                }
            });
        } else {
            res.send('ignored');
        }
    }

    function createCard(data, callback) {
        var trello = new Trello(data.key, data.token);
        trello.addCard(data.name, data.desc, data.idList,
        function (error, trelloCard) {
            callback(error, trelloCard);
            if (error) {
                console.log('Could not add card:', error);
            } else {
                console.log('Added card:', trelloCard);
                trello.addAttachmentToCard(trelloCard.id, data.url, function(error, trelloCard) {
                    if (error) {
                        console.log('Could not attach url: ', error);
                    } else {
                        console.log('url attached: ', trelloCard);
                    }
                });
            }
        });
    }

});


module.exports = router;
