const mysql = require('mysql2')

const config = {
        host: "localhost",
        user: "root",
        password: "1234",
};

const db = mysql.createConnection(config)

db.connect((err)=> {
    if(err) throw err;
    console.log("CONNECTED!");
    db.query(`CREATE DATABASE if not exists triple_server`,(err, results) => {
        if(err) throw err;
    })

    db.query('use triple_server',(err, results) => {
        if(err) throw err;
    })

    db.query(`CREATE TABLE if not exists user (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255),
        point INT)`,
        (err, results) => {
        if(err) throw err;
    })

    db.query(`CREATE TABLE if not exists review (
        id int AUTO_INCREMENT PRIMARY KEY,
        reviewsId int,
        content varchar(255),
        userId varchar(255),
        placeId varchar(255),
        NumOfPhoto int
        )`,
        (err, results) => {
        if(err) throw err;
    })

    db.query(`CREATE TABLE if not exists photo (
        id int AUTO_INCREMENT PRIMARY KEY,
        reviewId varchar(255),
        attachedPhotoIds varchar(255),
        userId varchar(255),
        placeId varchar(255)
        )`,
        (err, results) => {
        if(err) throw err;

    })

    db.query(`CREATE TABLE if not exists place (
        id int AUTO_INCREMENT PRIMARY KEY,
        placeId varchar(255)
        )`,
        (err, results) => {
        if(err) throw err;
    })

    console.log("Database and table set!")
})

module.exports = db;