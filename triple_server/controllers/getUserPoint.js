const db = require("../database/config")

const getUserPoint = async (req, res) => {
    const [userRows,userfields] = await db.execute(
        `SELECT * from user
        where userId = '${req.params.userId}'`,
        )

    if(userRows.length > 0){
        res.json({
            userId : req.params.userId,
            point : userRows[0].point
            })
    }else{
        res.json('유저가 존재하지 않습니다.')
    }
}

module.exports = getUserPoint