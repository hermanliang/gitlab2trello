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
    var issue = req.body,
        project = issue.project.name,
        url = issue.object_attributes.url,
        title = issue.object_attributes.title,
        description = issue.object_attributes.description;

    var result = {
            project: project,
            url: url,
            title: title,
            description: description
        };

        console.log(result);
    res.json(result);
});

module.exports = router;
