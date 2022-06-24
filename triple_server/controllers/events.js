const mysql = require('mysql2/promise')
const db = require("../database/config")

const postEvents = async(req, res) =>{

    answer = await addReview(req.body)
    res.json(answer)
}



const addReview = async(body) => {
    if (await alreadyReviewed(body.userId, body.placeId) === false) {
        await db.execute(
            `INSERT INTO review (reviewsId, content, userId, placeId, NumOfPhoto)
            VALUES ("${body.reviewId}","${body.content}", "${body.userId}","${body.placeId}",${body.attachedPhotoIds.length})`
        )
            return "리뷰 작성 완료!"
        }else {
            return "이미 리뷰를 작성하셨습니다."
        }

    
}

const modReview = () => {

}

const deleteReview = () => {

}

const alreadyReviewed = async (userId,placeId) =>{
    const [rows,fields] = await db.execute(
        `SELECT * from review
        where userId = '${userId}'
        and placeId = '${placeId}'`,
        )

    if(rows.length > 0){
        return true
    }else {
        return false
    }
}

const isFristReviewInplace = async (placeId) => {
    const [rows,fields] = await db.execute(
        `SELECT * from review
        where placeId = '${placeId}'`,
        )

    if(rows.length === 0){
        return true
    } else {
        return false
    }
}



const addPoint = async(userId,point) => {

}

const minusPoint = async(userId,point) => {

}

const pointCount = async(userId,point) =>{
    
}


module.exports = postEvents