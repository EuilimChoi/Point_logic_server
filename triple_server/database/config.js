const mysql = require('mysql2/promise')

const config = {
        host: "localhost",
        user: "root",
        password: "1234",
};

const db = mysql.createPool(config)


module.exports = db;