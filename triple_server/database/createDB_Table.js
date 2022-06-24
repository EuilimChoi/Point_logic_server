const db = require('./config')

const createDB = async () => {
    await db.query(`CREATE DATABASE if not exists triple_server`)

    await db.query('use triple_server')

    await db.query(`CREATE TABLE if not exists user (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255),
        point INT)`,
        )

    await db.query(`CREATE TABLE if not exists review (
        id int AUTO_INCREMENT PRIMARY KEY,
        reviewsId varchar(255),
        content varchar(255),
        userId varchar(255),
        placeId varchar(255),
        NumOfPhoto int
        )`,
        )

    await db.query(`CREATE TABLE if not exists photo (
        id int AUTO_INCREMENT PRIMARY KEY,
        reviewId varchar(255),
        attachedPhotoIds varchar(255),
        userId varchar(255),
        placeId varchar(255)
        )`,
        )

    await db.query(`CREATE TABLE if not exists place (
        id int AUTO_INCREMENT PRIMARY KEY,
        placeId varchar(255)
        )`,
        )

    console.log("Database and table set!")
}

module.exports = createDB;
