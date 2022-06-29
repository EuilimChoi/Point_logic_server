const db = require("../database/config")
const pointLogger = require("../config/logger.point")

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
			
			default :
				res.json("ADD,MOD,DELETE 만 사용할 수 있습니다.")
    } 
}

const addReview = async(addReviewInfo) => {
	let {userId,placeId,content,reviewId,action} = addReviewInfo

	let attachedPhotoIds =  JSON.stringify(addReviewInfo.attachedPhotoIds)

	if(await checkValidUser(userId) === false){
		return "유효하지 않는 유저입니다."
	}

	if (await isAlreadyReviewed(userId, placeId) === true) {
		return "이미 리뷰를 작성하셨습니다."
	}
	
	let givenPoint = await pointCount(addReviewInfo)

	await db.execute(
		`INSERT INTO review (reviewId, content, userId, placeId, attachedPhotoIds, givenPoint)
		VALUES ("${reviewId}","${content}", "${userId}","${placeId}",'${attachedPhotoIds}', ${givenPoint})`
	)
	
	await plusOrMinusPoint(userId,givenPoint)
	await pointLogger(addReviewInfo,givenPoint)

	return "리뷰 작성 완료!"
}

const modReview = async(modReviewInfo) => {
	let {userId,placeId,content,reviewId,action} = modReviewInfo
	let attachedPhotoIds =  JSON.stringify(modReviewInfo.attachedPhotoIds)

	const [reviewRows,userfields] = await db.execute(
		`SELECT * from review
		where reviewId = '${reviewId}'`
	)

	if(checkValidReview(reviewRows, userId)){
		return checkValidReview(reviewRows, userId)
	}

	let currentReviewPoint = reviewRows[0].givenPoint
	let givenPointAfterMod = await pointCount(modReviewInfo)
	let PointDiff = givenPointAfterMod-currentReviewPoint

	await db.execute(
		`UPDATE review 
		SET content = '${content}', attachedPhotoIds='${attachedPhotoIds}',givenPoint=${givenPointAfterMod}
		WHERE reviewId = '${reviewId}'`
	)

	await isFristReviewInplace(placeId)
	await plusOrMinusPoint(userId,PointDiff)

	if (PointDiff != 0){
		await pointLogger(modReviewInfo,PointDiff,reviewRows[0])
	}
	
	return `리뷰 수정 완료!`

	
}

const deleteReview = async(deleteReviewInfo) => {
	const {reviewId,userId} = deleteReviewInfo
	const [reviewRows,userfields] = await db.execute(
		`SELECT * from review
		where reviewId = '${reviewId}'`,
		)
	
	if(checkValidReview(reviewRows, userId)){
		return checkValidReview(reviewRows, userId)
	}
	
	let givenPoint = reviewRows[0].givenPoint
	await db.execute(
		`DELETE FROM review WHERE reviewId = "${reviewId}"`,
	)
	await plusOrMinusPoint(userId, -(givenPoint))
	await pointLogger(deleteReviewInfo,-givenPoint)

	return `리뷰가 삭제되었습니다.`
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
			return 1;
		case "isPhoto" :
			return 1;
		case "isContent" : 
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
	let reviewId = reviewInfo.reviewId
	let lengthOfReview = reviewInfo.content.length
	let numOfPhoto = reviewInfo.attachedPhotoIds.length
	let totalPointInThisReview = 0

	await isFristReviewInplace(reviewId,placeId) ?
		totalPointInThisReview += addPointRule("isFristReviewInplace") : 
		totalPointInThisReview += addPointRule("noPoint");
	
	numOfPhoto > 0 ? 
		totalPointInThisReview += addPointRule("isPhoto") : 
		totalPointInThisReview += addPointRule("noPoint" )

	lengthOfReview > 0 ?
			totalPointInThisReview += addPointRule("isContent") : 
			totalPointInThisReview += addPointRule("noPoint" )
        
	return totalPointInThisReview
}

const checkValidUser = async (userId) =>{
	const [userRows,fields] = await db.execute(
		`SELECT * from user
		where userId = '${userId}'`,
	)

	if(userRows.length > 0){
		return true
	}else {
		return false
	}
}

const checkValidReview = (curReview, modUserId) =>{
	if(curReview.length === 0){
		return "리뷰가 존재하지 않습니다."
	}else if(curReview[0].userId != modUserId){
		return "게시글 작성자가 아닙니다."
	}
}

module.exports = {
    postEvents,
    addReview,
    modReview,
    deleteReview,
    isAlreadyReviewed,
    isFristReviewInplace,
    addPointRule,
    plusOrMinusPoint,
    pointCount}