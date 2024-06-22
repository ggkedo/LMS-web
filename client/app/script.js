//const { encode } = require("punycode");

async function displayProjects()
{
    var details = {'table': 'Projects'};
    var formBody = [];
    for(var property in details)
    {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    };
    formBody = formBody.join("&");
    console.log(formBody);
    const response = await fetch("http://10.0.1.70:3000/list-table",
        {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
            body: formBody,
            mode: 'cors'
        }
    );
    const projects = await response.json();
}

console.log('Script.js running...');
displayProjects();