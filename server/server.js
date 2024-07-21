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
    const filter = req.body.filter ? JSON.parse(req.body.filter) : null;

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

app.post('/join-tables', (req, res) =>
{
    const table1 = req.body.table1;
    const table2 = req.body.table2;
    const fields1 = req.body.fields1;
    const fields2 = req.body.fields2;
    const key1 = req.body.key1;
    const key2 = req.body.key2;

    const tableStructure1 = dbTableStructure[table1];
    const tableStructure2 = dbTableStructure[table2];

    if(!table1 || !table2) 
    {
        sendResponse(res, {status: 400, error: 'Table1 and Table2 required', body: {}});
    }
    else if (!tableStructure1 || !tableStructure2)
    {
        sendResponse(res, {status: 400, error: 'Invalid table name', body: {}});
    }
    else if (!key1 || !key2)
    {
        sendResponse(res, {status: 400, error: 'Keys required to join on', body: {}});
    }
    else
    {
        dbcontroller.joinTables(table1, table2, key1, key2, fields1, fields2)
        .then(result => sendResponse(res, result));
    }
})

app.post('/get-record/:id', (req, res) =>
{
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];
    const recordID = req.params.id;

    if(!tableName) 
    {
        sendResponse(res, {status: 400, error: 'Table required', body: {}});
    }
    else if (!tableStructure)
    {
        sendResponse(res, {status: 400, error: 'Invalid table name', body: {}});
    }
    /*
    else if (!recordID)
    {
        sendResponse(res, {status: 400, error: 'Record ID required', body: {}});
    }
    */
    else
    {
        dbcontroller.getRecord(tableName, recordID)
        .then(result => sendResponse(res, result));
    }
})

app.post('/add-record', (req, res) =>
{
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];
    var data = req.body.data ? JSON.parse(req.body.data) : null;
    //var data = req.body;
    console.log(data);

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
        dbcontroller.insertRecord(tableName, data)
        .then(result => sendResponse(res, result));
    }
})

app.post('/update-record/:id', (req, res) =>
{
    const id = req.params.id;
    const tableName = req.body.table;
    const tableStructure = dbTableStructure[tableName];
    var data = req.body.data ? JSON.parse(req.body.data) : null;

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
        dbcontroller.updateRecord(tableName, id, data)
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
        dbcontroller.deleteRecord(tableName, id)
        .then(result => sendResponse(res, result));
    }
})

app.get('/*', (req, res) =>
{
    sendResponse(res, {status: 400, error: 'Bad request', body: null});
});

app.post('/*', (req, res) =>
{
    sendResponse(res, {status: 400, error: 'Bad request', body: null});
});

async function Server()
{
    app.listen(process.env.SVR_PORT);
};

Server();