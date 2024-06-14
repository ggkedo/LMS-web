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

async function filterTable(tableName, tableStructure, filter)
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
            return {result: null, error: 'Invalid column name'};
        }        
    }
    sql = sql.slice(0, -5);
    
    await ps.prepare(sql);
    try
    {
        result = await ps.execute(filter);
        ps.unprepare();
        //console.log(result.recordset);
        return {result: result.recordset, error: null};
    }
    catch (e)
    {
        console.log(e.message)
        return {result: null, error: e.message};
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
            return {result: null, error: 'Invalid column name'};
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
        return {inserted: result.recordset[0].ID, error: null};
    }
    catch (e)
    {
        return {inserted: null, error: e.message};
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
        return {deleted: id, error: null};
    }
    catch (e)
    {
        return {deleted: null, error: e.message};
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
            return {result: null, error: 'Invalid column name'};
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
        return {updated: data, error: null};
    }
    catch (e)
    {
        return {updated: null, error: e.message};
    };
};

app.get("/", (req, res) =>
{
    res.status(200).json({message: 'API server running'});
});

//Projects table operations
app.get("/list-projects", (req, res) =>
{
    /*
    res.writeHead(200, 
        {
            'Content-Type': 'application/json;charset=utf8',
            'access-control-allow-origin': '*'
        });
    */

    const filter = req.body;
    const tableStructure = dbTableStructure.Samples;

    listTable('Projects', tableStructure, filter)
    .then(result => res.status(result.status).json(result));

    /*
    var sql = "SELECT * FROM Projects";
    db.query(sql, (err, result) =>
    {
        var json = JSON.stringify(result.recordset);
        res.write(json);
        res.send();
    });
    */
});

app.post('/add-project/', (req, res) =>
{
    try
    {
        var data = req.body;
        //console.log(data);

        if(!data.name || !data.company)
        {
            res.status(400).json({message: 'Invalid data'});
        }
        else
        {
            var insertValues = 
            {
                name: data.name || null,
                company: data.company || null,
                managerEmail: data.managerEmail || null,
                groupEmail: data.groupEmail || null,
                sendEmail: data.sendEmail || false
            };

            //console.log(insertValues);

            const ps = new db.PreparedStatement();
            ps.input('name', db.VarChar(20));
            ps.input('company', db.VarChar(10));
            ps.input('managerEmail', db.VarChar(30));
            ps.input('groupEmail', db.VarChar(30));
            ps.input('sendEmail', db.Bit);

            ps.prepare('INSERT INTO Projects (Name, Company, ManagerEmail, GroupEmail, SendEmailByDefault) OUTPUT inserted.ID VALUES (@name, @company, @managerEmail, @groupEmail, @sendEmail)', e => 
            {
                ps.execute(insertValues, (e, result) =>
                {
                    if(e)
                    {
                        res.status(500).json({message: 'Failed to save data'});
                        console.log(e.message);
                    }
                    else
                    {
                        console.log(result);
                        res.status(200).json(
                        {
                            message: 'Data saved', 
                            data: insertValues,
                            id: result.recordset[0].ID
                        });
                        ps.unprepare(e => {});
                    }
                });
            });



        }
    }
    catch (error)
    {
        res.status(500).json({message: 'Internal server error'});
        console.log(error.message);
    }
});

app.post('/update-project/:id', (req, res) =>
{
    var data = req.body;

    const tableStructure = dbTableStructure.Projects;
    const ps = new db.PreparedStatement();
    var sql = "UPDATE Projects SET ";
    for(var key of Object.keys(data))
    {
        if(tableStructure[key])
        {
            ps.input(key, tableStructure[key]);
            sql += key + " = @" + key + ", ";
            //console.log(key + ' -> ' + key);
        }
    };

    sql = sql.slice(0, -2) + " WHERE ID = @ID";
    
    ps.input("ID", db.Int())
    data["ID"] = req.params.id;
    ps.prepare(sql, e => 
    {
        if(e)
        {
            res.status(500).json({message: 'Invalid data given'});
            console.log(e.message);
        }
        else
        {        
            ps.execute(data, e =>
            {
                if(e)
                {
                    res.status(500).json({message: 'Failed to update project details'});
                    console.log(e.message);
                }
                else
                {
                    res.status(200).json(
                        {
                            message: 'Project details updated',
                            data: data
                        });
                    ps.unprepare(e=>{});
                }
            });
        }
    });
});

app.get('/delete-project/:id', (req, res) =>
{
    const id = req.params.id;
    const ps = new db.PreparedStatement();
    ps.input("ID", db.Int());
    ps.prepare("DELETE FROM Projects WHERE ID = @ID", e =>
    {
        if(!e)
        {
            ps.execute({ID: id}, e =>
            {
                if(e)
                {
                    res.status(500).json({message: 'Failed to delete project', ID: id, error: e.message});
                    console.log(e.message);
                }
                else
                {
                    ps.unprepare(e=>{});
                    res.status(200).json({message: 'Project deleted', ID: id})
                }                
            });
        }
        else
        {
            res.status(500).json({message: 'Error executing command'});
            console.log(e.message);
        }
    });
});

//Requests table operations
app.get('/list-requests', (req, res) =>
{
    res.writeHead(200, 
        {
            'Content-Type': 'application/json;charset=utf8',
            'access-control-allow-origin': '*'
        });

    var sql = "SELECT * FROM Requests";
    db.query(sql, (err, result) =>
    {
        var json = JSON.stringify(result.recordset);
        res.write(json);
        res.send();
    });
});

app.post('/list-requests', (req, res) =>
{
    const filter = req.body.filter;
    const tableStructure = dbTableStructure.Requests;

    filterTable('Requests', tableStructure, filter)
    .then(result => 
        {
            if(result.error)
            {
                res.status(500).json({message: result.error});
            }
            else
            {
                res.status(200).json({message: 'A-OK', records: result.result});
            }
        });
});

app.post('/add-request', (req, res) =>
{
    const data = req.body;
    const tableStructure = dbTableStructure.Requests;

    insertRow('Requests', tableStructure, data)
    .then(result =>
    {
        if(result.error)
        {
            res.status(500).json({message: result.error});
        }
        else
        {
            res.status(200).json(
            {
                message: 'Row inserted', 
                id: result.inserted,
                data: data
            });
        }
    });
});

app.get('/delete-request/:id', (req, res) =>
{
    deleteRow('Requests', req.params.id)
    .then(result =>
        {
            if(result.error)
            {
                res.status(500).json({message: result.error});
            }
            else
            {
                res.status(200).json({message: 'Row deleted', id: req.params.id});
            }
        });
});

app.post('/update-request/:id', (req, res) =>
{
    const tableStructure = dbTableStructure.Requests;
    const id = req.params.id;
    var data = req.body;

    updateRow('Requests', tableStructure, id, data)
    .then(result =>
    {
        if(result.error)
        {
            res.status(500).json({message: result.error});
        }
        else
        {
            res.status(200).json({message: 'Record updated', data: result.updated});
        }
    });
    
});

//Samples table operations
app.post('/list-samples', (req, res) =>
{
    const filter = req.body;
    const tableStructure = dbTableStructure.Samples;

    listTable('Samples', tableStructure, filter)
    .then(result => res.status(result.status).json(result));
});

async function Server()
{
    await db.connect(sqlConfig);
    app.listen(process.env.SVR_PORT);
};

Server();