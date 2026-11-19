require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: 'butikvarejo-tratordeobra-a2e4.f.aivencloud.com',
    port: 26727,
    user: 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: 'defaultdb',
    ssl: { ca: fs.readFileSync(path.join(__dirname, 'ca.pem')) }
});

module.exports = pool;
