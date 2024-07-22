# NodeJS CRUD REST API

## Functions


## Endpoints

| URL               | Method | Parameter(s)                                  | Description                            |
|-------------------|--------|-----------------------------------------------|----------------------------------------|
| /list-table       | POST   | table, filter                                 | list all records from table            |
| /join-tables      | POST   | table1, table2, key1, key2, fields1, fields2  | join two tables and return given fields|
| /get-record/:id   | POST   | table                                         | get record from table by ID            |
| /add-record       | POST   | table, data                                   | add record to table                    |
| /update-record/:id| POST   | table, data                                   | update record in table given           |
| /delete-record/:id| POST   | table                                         | delete record from table               | 

## Response structure
```
{
  "status": int,
  "error": bool,
  "body":
  {
    "data": obj
  }
}
```
