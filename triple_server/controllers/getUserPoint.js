const db = require("../database/config")

const getUserPoint = async (req, res) => {
try {
    const [userRows,userfields] = await db.execute(
        `SELECT * from user
        where userId = '${req.params.userId}'`,
        )

    if(userRows.length > 0){
        res.status(200).json({
            userId : req.params.userId,
            point : userRows[0].point
            })
    }else{
        res.status(400).json({message : '유저가 존재하지 않습니다.', userId : req.params.userId})
    }
}catch(err){
    res.status(500).json({message : "server ERR"})
    console.log(err)
}

}

module.exports = getUserPoint