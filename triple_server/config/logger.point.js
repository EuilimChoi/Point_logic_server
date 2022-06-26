const db = require("../database/config")
const {pointCount} = require("../controllers/events");

const pointLogger = async(userId, reviewId, pointChange, action, reviewInfo) =>{
    // 기존에 있는 리뷰 아이디랑, 지금 신규 리뷰들이랑 비교하면 비교하면서 로거 만들 수 있지 않을까,,?
    console.log("logger!!!!!!!!!!!!!!!!!!!!!!!")

    const [userRows,fields] = await db.execute(
        `SELECT * from user
        WHERE userId = '${userId}'`
        )
    
    let preUserPoint = userRows[0].point



    switch (action) {
        case "ADD":
            await db.execute(
                `INSERT INTO pointlog (userId, reviewId, pointChange, pointNow, changeDetail)
                VALUES ("${userId}","${reviewId}","${pointChange}","${preUserPoint}","ADD new review")`
            )
        break;

        case "MOD":
            const [reviewRows,userfields] = await db.execute(
                `SELECT * from review
                where reviewId = '${reviewId}'`,
                )
        
            let currentReviewLength = reviewInfo.content.length
            let currentReviewPhoto = JSON.parse(reviewInfo.attachedPhotoIds).length
            let modReviewLength = reviewRows[0].content.length
            let modReviewPhotoIds = JSON.parse(reviewRows[0].attachedPhotoIds).length
            let changeDetail = ""
        
            if ((currentReviewLength > 0 && modReviewLength === 0)&&(currentReviewPhoto > 0 && modReviewPhotoIds === 0)){
                changeDetail = "MOD review, DELTE content,photo"
            } else if (currentReviewPhoto > 0 && modReviewPhotoIds === 0){
                changeDetail = "MOD review, DELETE photo"
            } else if (currentReviewLength > 0 && modReviewLength === 0){
                changeDetail = "MOD review, DELETE content"
            } else if ((currentReviewLength === 0 && modReviewLength > 0)&&(currentReviewPhoto === 0 && modReviewPhotoIds > 0)){
                changeDetail = "MOD review , ADD content,photo"
            } else if (currentReviewPhoto === 0 && modReviewPhotoIds > 0){
                changeDetail = "MOD review, ADD photo"
            } else if (currentReviewLength === 0 && modReviewLength > 0){
                changeDetail = "MOD review, ADD content"
            }

            await db.execute(
                `INSERT INTO pointlog (userId, reviewId, pointChange, pointNow, changeDetail)
                VALUES ("${userId}","${reviewId}","${pointChange}","${preUserPoint}","${changeDetail}")`
            )
            break;

        case "DELETE":
            await db.execute(
                `INSERT INTO pointlog (userId, reviewId, pointChange, pointNow, changeDetail)
                VALUES ("${userId}","${reviewId}","${pointChange}","${preUserPoint}","DELETE review")`
            )
            break;
    
    }

    console.log(`INSERT INTO pointlog`)
}

module.exports = pointLogger