const mysql = require('mysql2/promise')
const db = require("../database/config")

const postEvents = ((req, res) =>{
    db.query('SELECT * from user',(err, results) => {
        if(err) throw err;
        res.json(results)
    })
})





module.exports = postEvents