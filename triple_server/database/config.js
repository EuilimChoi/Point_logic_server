const mysql = require('mysql2/promise')
const dotenv = require('dotenv');
dotenv.config();

const config = {
        host: process.env.host,
        user: process.env.user,
        password: process.env.password,
};

const db = mysql.createPool(config)


module.exports = db;