require('dotenv').config();
const db = require('mssql');
const express = require('express');
const postParser = require('body-parser');
const app = express();
//app.use(postParser.urlencoded({extended: true}));
app.use(postParser.json());

const sqlConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    port: process.env.DB_PORT,
    options:
    {
        encrypt: false
    }
};

const dbTableStructure = 
{
    Projects:
    {
        ID: db.Int(),
        Name: db.NVarChar(20),
        ManagerEmail: db.NVarChar(30),
        GroupEmail: db.NVarChar(30),
        Company: db.NVarChar(10),
        sendEmailByDefault: db.Bit()
    },
    Requests:
    {
        ID: db.Int(),
        ProjectId: db.Int(),
        Status: db.NVarChar(50),
        RequestorEmail: db.NVarChar(50),
        IsInternal: db.Bit(),
        SendEmail: db.Bit(),
        EmailNotify: db.NVarChar(100),
        IsDelivered: db.Bit(),
        TotalCost: db.Int(),
        Comments: db.NVarChar(100),
        Created: db.DateTime2(7),
        ReportLink: db.NVarChar(150),
        Modified: db.DateTime2(7)  
    },
    Samples:
    {
        ID: db.Int(),
        RequestId: db.Int(),
        Name: db.NVarChar(50),
        IsMeasured: db.Bit(),
        SampleDate: db.DateTime2(7),
        SampleLocation: db.NVarChar(20),
        SampleSubLocation: db.NVarChar(20),
        SampleName: db.NVarChar(20),
        Created: db.DateTime2(7)
    }
}

async function connectToSqlServer()
{
    try
    {
        await db.connect(sqlConfig);
    }
    catch (error)
    {
        console.error('Error:', error.message);
    }
};

function isEmpty(obj)
{
    return Object.keys(obj).length === 0;
}

async function listTable(tableName, tableStructure, filter=null)
{
    if(!filter)
    {
        var sql = "SELECT * FROM " + tableName;
        try
        { 
            result = await db.query(sql); 
            return {
                status: 200,
                error: false,
                body: {data: result.recordset} 
            };
        }
        catch (e)
        { 
            return {
                status: 500,
                error: e.message,
                body: {data: []} 
            };;
        }
    }
    else
    {
        const ps = new db.PreparedStatement();
        var sql = "SELECT * FROM " + tableName + " WHERE ";
        for(var key of Object.keys(filter))
        {
            if(tableStructure[key])
            {
                ps.input(key, tableStructure[key]);
                sql += key + " = @" + key + " AND ";
            }
            else
            {
                return {
                    status: 400,
                    error: 'Invalid column name',
                    body: {data: []} 
                };
            }        
        }
        sql = sql.slice(0, -5);
        
        await ps.prepare(sql);
        try
        {
            result = await ps.execute(filter);
            ps.unprepare();
            return {
                status: 200,
                error: false,
                body: {data: result.recordset} 
            };
        }
        catch (e)
        {
            console.log(e.message)
            return {
                status: 200,
                error: e.message,
                body: {data: []} 
            };
        }
    }
};

async function insertRow(tableName, tableStructure, data)
{
    const ps = new db.PreparedStatement();
    var sql1 = "INSERT INTO " + tableName + " (";
    var sql2 = "VALUES (";
    for(var key of Object.keys(data))
    {
        if(tableStructure[key])
        {
            ps.input(key, tableStructure[key]);
            sql1 += key + ", ";
            sql2 += "@" + key + ", ";
        }
        else
        {
            return {
                status: 400,
                error: 'Invalid column name',
                body: {} 
            };
        }        
    };

    sql1 = sql1.slice(0, -2) + ")";
    sql2 = sql2.slice(0, -2) + ")";
    var sql = sql1 + " OUTPUT inserted.ID " + sql2;

    await ps.prepare(sql);
    try
    {
        result = await ps.execute(data);
        ps.unprepare();
        return {
            status: 200,
            error: false,
            body: {inserted: result.recordset[0].ID} 
        };
    }
    catch (e)
    {
        return {
            status: 500,
            error: e.message,
            body: {} 
        };
    }
};

async function deleteRow(tableName, id)
{
    const ps = new db.PreparedStatement();
    const sql = "DELETE FROM " + tableName + " WHERE ID = @ID";
    ps.input('ID', db.Int());
    
    await ps.prepare(sql);
    try
    {
        await ps.execute({ID: id});
        ps.unprepare();
        return {
            status: 200,
            error: false,
            body: {deleted: id} 
        };
    }
    catch (e)
    {
        return {
            status: 500,
            error: e.message,
            body: {} 
        };
    }  
};

async function updateRow(tableName, tableStructure, id, data)
{
    const ps = new db.PreparedStatement();
    var sql = "UPDATE " + tableName + " SET ";
    for(var key of Object.keys(data))
    {
        if(tableStructure[key])
        {
            ps.input(key, tableStructure[key]);
            sql += key + " = @" + key + ", ";
        }
        else
        {
            return {
                status: 400,
                error: 'Invalid column name',
                body: {} 
            };
        }        
    };
    sql = sql.slice(0, -2) + " WHERE ID = @ID";
    data["ID"] = id;
    ps.input("ID", db.Int());

    await ps.prepare(sql)    
    try
    {
        result = await ps.execute(data);
        ps.unprepare();
        return {
            status: 200,
            error: false,
            body: {updated: data} 
        };
    }
    catch (e)
    {
        return {
            status: 500,
            error: e.message,
            body: {} 
        };
    };
};

function sendResponse(response, result)
{
    response.writeHead(result.status, 
    {
        'Content-Type': 'application/json;charset=utf8',
        'access-control-allow-origin': '*'
    });
    response.write(JSON.stringify(result));
    response.send();
};

app.get("/", (req, res) =>
{
    res.status(200).json({message: 'API server running'});
});

//Projects table operations
app.get("/list-projects", (req, res) =>
{
    //const filter = req.body;
    const tableStructure = dbTableStructure.Samples;

    listTable('Projects', tableStructure)
    .then(result => sendResponse(res, result));
});

app.post('/add-project/', (req, res) =>
{
    const tableStructure = dbTableStructure.Projects;
    const data = req.body;

    insertRow('Projects', tableStructure, data)
    .then(result => sendResponse(res, result));
});

app.post('/update-project/:id', (req, res) =>
{
    var data = req.body;
    const id = req.params.id;
    const tableStructure = dbTableStructure.Projects;

    updateRow('Projects', tableStructure, id, data)
    .then(result => sendResponse(res, result));
});

app.get('/delete-project/:id', (req, res) =>
{
    const id = req.params.id;
    const tableStructure = dbTableStructure.Projects;

    deleteRow('Projects', id)
    .then(result => sendResponse(res, result));
});

//Requests table operations
app.get('/list-requests', (req, res) =>
{
    const tableStructure = dbTableStructure.Requests;

    listTable('Requests', tableStructure)
    .then(result => sendResponse(res, result));
});

app.post('/list-requests', (req, res) =>
{
    const filter = req.body.filter;
    const tableStructure = dbTableStructure.Requests;

    listTable('Requests', tableStructure, filter)
    .then(result => sendResponse(res, result));
});

app.post('/add-request', (req, res) =>
{
    const tableStructure = dbTableStructure.Requests;
    const data = req.body;

    insertRow('Requests', tableStructure, data)
    .then(result => sendResponse(res, result));
});

app.get('/delete-request/:id', (req, res) =>
{
    deleteRow('Requests', req.params.id)
    .then(result => sendResponse(res, result));
});

app.post('/update-request/:id', (req, res) =>
{
    const tableStructure = dbTableStructure.Requests;
    const id = req.params.id;
    var data = req.body;

    updateRow('Requests', tableStructure, id, data)
    .then(result => sendResponse(res, result));
    
});

//Samples table operations
app.post('/list-samples', (req, res) =>
{
    const filter = req.body;
    const tableStructure = dbTableStructure.Samples;

    listTable('Samples', tableStructure, filter)
    .then(result => sendResponse(res, result));
});

async function Server()
{
    await db.connect(sqlConfig);
    app.listen(process.env.SVR_PORT);
};

Server();