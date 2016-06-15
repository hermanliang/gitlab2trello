var express = require('express');
var router = express.Router(),
    mongo = require('mongodb').MongoClient;

require('dotenv').config();

var mongoUrl = process.env.MONGODB_URI;
/* GET home page. */
router.get('/', function(req, res, next) {
  mongo.connect(mongoUrl, function (err, db) {
    var collection = db.collection('headers');
    collection.find().toArray(function(err, documents) {
      res.render('index', { title: 'Hooker', headers: JSON.stringify(documents) });
      db.close();
    })
  })
});

module.exports = router;
