const db = require('./config')

const createDB = async () => {
    await db.query(`CREATE DATABASE if not exists triple_server`)

    await db.query('USE triple_server')

    await db.query(`CREATE TABLE if not exists user (
        userId VARCHAR(255) PRIMARY KEY,
        point INT)`,
        )

    await db.query(`CREATE TABLE if not exists review (
        reviewId varchar(255) PRIMARY KEY,
        content varchar(255),
        userId varchar(255),
        placeId varchar(255),
        attachedPhotoIds varchar(255),
        givenPoint int,
        addTime datetime default(current_time)
        )`,
        )

    await db.query(`CREATE TABLE if not exists place (
        placeId varchar(255) PRIMARY KEY
        )`,
        )

    await db.query(`INSERT IGNORE INTO user (userId,point) values ("3ede0ef2-92b7-4817-a5f3-0c575361f745",0)`)
    await db.query(`INSERT IGNORE INTO place (placeId) values ("2e4baf1c-5acb-4efb-a1af-eddada31b00f")`)

    console.log("Database and table set!")
}

module.exports = createDB;
