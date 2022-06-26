const mysql = require('mysql2/promise')
const db = require("../database/config")

const postEvents = async(req, res) =>{
    const action = req.body.action
    switch (action){
        case "ADD":
            const addReviewAnswer = await addReview(req.body)
            res.json(addReviewAnswer)
            break;
            
        case "MOD":
            const modReviewAnswer = await modReview(req.body)
            res.json(modReviewAnswer)
            break;

        case "DELETE":
            const deleteReviewAnswer = await deleteReview(req.body)
            res.json(deleteReviewAnswer)
            break;
    } 
}

const addReview = async(reviewInfo) => {
    let userId = reviewInfo.userId
    let placeId = reviewInfo.placeId
    let content = reviewInfo.content
    let reviewId = reviewInfo.reviewId
    let attachedPhotoIds =  JSON.stringify(reviewInfo.attachedPhotoIds)
    
    if (await isAlreadyReviewed(userId, placeId) === false) {
        let givenPoint = await pointCount(reviewInfo)
        await db.execute(
            `INSERT INTO review (reviewId, content, userId, placeId, attachedPhotoIds, givenPoint)
            VALUES ("${reviewId}","${content}", "${userId}","${placeId}",'${attachedPhotoIds}', ${givenPoint})`
        )
        await plusOrMinusPoint(userId,givenPoint)
        
        return "리뷰 작성 완료!"

    }else {
        return "이미 리뷰를 작성하셨습니다."
    }
}

const modReview = async(reviewInfo) => {
    let userId = reviewInfo.userId
    let placeId = reviewInfo.placeId
    let content = reviewInfo.content
    let reviewId = reviewInfo.reviewId
    let attachedPhotoIds =  JSON.stringify(reviewInfo.attachedPhotoIds)

    const [reviewRows,userfields] = await db.execute(
        `SELECT * from review
        where reviewId = '${reviewId}'`,
        )
        let currentReviewPoint = reviewRows[0].givenPoint
        let givenPointAfterMod = await pointCount(reviewInfo)
        let PointDiff = givenPointAfterMod-currentReviewPoint
        console.log(currentReviewPoint, givenPointAfterMod, PointDiff)

    if(reviewRows.length > 0){

    await db.execute(
        `UPDATE review 
        SET content = '${content}', attachedPhotoIds='${attachedPhotoIds}',givenPoint=${givenPointAfterMod}
        WHERE reviewId = '${reviewId}'`
    )

    await isFristReviewInplace(placeId)
    await plusOrMinusPoint(userId,PointDiff)
    
    return `리뷰 수정 완료 완료!`
    }else{
        return `해당 리뷰가 존재하지 않습니다!`
    }
}

const deleteReview = async(reviewInfo) => {
    let reviewId = reviewInfo.reviewId
    let userId = reviewInfo.userId
    const [reviewRows,userfields] = await db.execute(
        `SELECT givenPoint from review
        where reviewId = '${reviewId}'`,
        )
    
    if(reviewRows.length > 0) {
        let givenPoint = reviewRows[0].givenPoint
        await db.execute(
            `DELETE FROM review WHERE reviewId = "${reviewId}"`,
            )
        await plusOrMinusPoint(userId, -(givenPoint))
        return `리뷰가 삭제되었습니다. 포인트 회수 ${-(givenPoint)}`
    }else{
        return `해당 리뷰가 존재하지 않습니다!`
    }
}

const isAlreadyReviewed = async (userId,placeId) =>{
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

const isFristReviewInplace = async (reviewId,placeId) => {
    const [reviewRows,fields] = await db.execute(
        `SELECT * from review
        where placeId = '${placeId}'
        ORDER BY addTime`,
        )

    if(reviewRows.length === 0 || reviewRows[0].reviewId === reviewId){
        return true
    } else {
        return false
    }
}

const addPointRule = (rule) => {
    switch (rule){
        case "isFristReviewInplace" : 
            return 2;
        case "isNotFristReviewInplace" : 
            return 1;
        case "isPhoto" :
            return 1;
        case "addPhotoFromNoPhoto" :
            return 1;
        case "noPoint" :
            return 0
    }
}

const plusOrMinusPoint = async(userId,givenpoint) => {
    const [userRows,fields] = await db.execute(
        `SELECT * from user
        WHERE userId = '${userId}'`
        )
    
    let preUserPoint = userRows[0].point
    
    await db.query(
        `UPDATE user SET point = ${preUserPoint}+${givenpoint}`)
}

const pointCount = async (reviewInfo) =>{
    let placeId = reviewInfo.placeId
    let numOfPhoto = reviewInfo.attachedPhotoIds.length
    let totalPointInThisReview = 0

    await isFristReviewInplace(placeId) ?
        totalPointInThisReview += addPointRule("isFristReviewInplace") : 
        totalPointInThisReview += addPointRule("isNotFristReviewInplace")

    numOfPhoto > 0 ? 
        totalPointInThisReview += addPointRule("isPhoto") : 
        totalPointInThisReview += addPointRule("noPoint" )

    return totalPointInThisReview
}


module.exports = postEvents