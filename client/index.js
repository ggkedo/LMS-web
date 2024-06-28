const { PromiseInspection } = require('tarn/dist/PromiseInspection.js');

require('./app/controller.js');
require('./app/view.js');

const postParser = require('body-parser');
const express = reqire('express');
const app = express();
app.use(postParser.urlencoded({extended: true}));

app.get("/", (req, res) =>
{
    res.write("Hello World!");
    res.send();
})