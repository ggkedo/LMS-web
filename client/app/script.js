//const { encode } = require("punycode");
const API_ROOT = "http://192.168.0.99:3000";

async function sendPostRequest(endpoint, details)
{
    var formBody = [];
    for(var property in details)
    {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    };
    formBody = formBody.join("&");
    const response = await fetch(API_ROOT + "/" + endpoint,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
            body: formBody,
            mode: 'cors'
        }
    );
    return await response.json();
}

async function displayProjects()
{
    const details = {'table': 'Projects'};
    const projects = await sendPostRequest("list-table", details);
    
    var data = projects['body']['data'];
    for(var project of data)
    {
        űconsole.log(project['Name'], project['Company']);
    }

}

//console.log('Script.js running...');
displayProjects();