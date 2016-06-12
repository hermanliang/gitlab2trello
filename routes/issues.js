/**
 * Created by xlin on 11/06/16.
 */
'use strict';

var express = require("express"),
    router = express.Router(),
    bodyParser = require("body-parser"),
    app = express();

app.use(bodyParser.json());
router.post('/', function (req, res) {
    res.json(req.headers);
});

module.exports = router;
