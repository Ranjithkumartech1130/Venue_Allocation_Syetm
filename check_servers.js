const http = require('http');

const check = (port, name) => {
    http.get(`http://localhost:${port}/`, (res) => {
        console.log(`${name} is UP (Status: ${res.statusCode})`);
        res.resume();
    }).on('error', (e) => {
        console.log(`${name} is DOWN (Error: ${e.message})`);
    });
};

check(5000, 'Backend');
check(5173, 'Frontend');
