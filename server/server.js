require('dotenv').config();
const dbcontroller = require('./dbcontroller');
const dbTableStructure = dbcontroller.getDBstructure();
const express = require('express');
const postParser = require('body-parser');
const app = express();
app.use(postParser.urlencoded({extended: true}));
//app.use(postParser.json());

function sendResponse(response, result)
{
    console.log(new Date().toISOString() + ' Serving request...');
    console.log(result);
    response.writeHead(result.status, 
    {
        'Content-Type': 'application/json;charset=utf8',
        'Access-Control-Allow-Origin': '*'
    });
    response.write(JSON.stringify(result));
    response.send();
};

app.get("/", (req, res) =>
{
    sendResponse(res, {status: 200, error: false, body: {message: 'API server running'}});
});

app.post('/list-table', (req, res) =>
{
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];
    const filter = req.body.filter;

    if(!tableName) 
    {
        sendResponse(res, {status: 400, error: 'Table required', body: {}});
    }
    else if (!tableStructure)
    {
        sendResponse(res, {status: 400, error: 'Invalid table name', body: {}});
    }
    else
    {
        //listTable(tableName, tableStructure, filter)
        dbcontroller.listTable(tableName, filter)
        .then(result => sendResponse(res, result));
    }
})

app.post('/add-record', (req, res) =>
{
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];
    var data = req.body.data;

    if(!tableName) 
    {
        sendResponse(res, {status: 400, error: 'Table required', body: {}});
    }
    else if (!tableStructure)
    {
        sendResponse(res, {status: 400, error: 'Invalid table name', body: {}});
    }
    else
    {
        insertRecord(tableName, data)
        .then(result => sendResponse(res, result));
    }
})

app.post('/update-record/:id', (req, res) =>
{
    const id = req.params.id;
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];
    var data = req.body.data;

    if(!tableName) 
    {
        sendResponse(res, {status: 400, error: 'Table required', body: {}});
    }
    else if (!tableStructure)
    {
        sendResponse(res, {status: 400, error: 'Invalid table name', body: {}});
    }
    else
    {
        updateRecord(tableName, id, data)
        .then(result => sendResponse(res, result));
    }
})

app.post('/delete-record/:id', (req, res) =>
{
    const id = req.params.id;
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];

    if(!tableName) 
    {
        sendResponse(res, {status: 400, error: 'Table required', body: {}});
    }
    else if (!tableStructure)
    {
        sendResponse(res, {status: 400, error: 'Invalid table name', body: {}});
    }
    else
    {
        deleteRecord(tableName, id)
        .then(result => sendResponse(res, result));
    }
})

app.get('/*', (req, res) =>
{
    sendResponse(res, {status: 400, error: 'Bad request', body: null});
});

async function Server()
{
    app.listen(process.env.SVR_PORT);
};

Server();