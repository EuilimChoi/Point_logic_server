const db = require("../database/config")
const pointLogger = require("../config/logger.point")

const postEvents = async(req, res) =>{
	const action = req.body.action
	let answer = []

	try {
		for(i of req.body){
			switch (i.action){
				case "ADD":
					answer.push(await addReview(i))
					break;
				case "MOD":
					answer.push(await modReview(i))
					break;
				case "DELETE":
					answer.push(await deleteReview(i))
					break;
				default :
					answer.push({message : "ADD,MOD,DELETE 만 사용할 수 있습니다."})
					break;
			} 
		}
	
		res.status(200).json(answer)
	}catch{
		res.status(400).json({message : "server ERR"})
	}
}

	const addReview = async(addReviewInfo) => {
	let {userId,placeId,content,reviewId} = addReviewInfo
	let attachedPhotoIds = addReviewInfo.attachedPhotoIds


	if(await checkValidUser(userId) === false){
		return {message : "유효하지 않는 유저입니다.", reviewId : reviewId, userId : userId}
	}

	if (await isAlreadyReviewed(userId, placeId) === true) {
		return {message : "이미 리뷰를 작성하셨습니다.",reviewId : reviewId, userId : userId}
	}
	
	let givenPoint = await pointCount(addReviewInfo)

	await db.execute(
		`INSERT INTO review (reviewId, content, userId, placeId, attachedPhotoIds, givenPoint)
		VALUES ("${reviewId}","${content}", "${userId}","${placeId}",'${attachedPhotoIds}', ${givenPoint})`
	)
	
	await plusOrMinusPoint(userId,givenPoint)
	await pointLogger(addReviewInfo,givenPoint)

	return {message : "리뷰 작성 완료!" , reviewId : reviewId, userId : userId}
}

const modReview = async(modReviewInfo) => {
	let {userId,placeId,content,reviewId} = modReviewInfo
	let attachedPhotoIds = (modReviewInfo.attachedPhotoIds)

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
	
	return {message : `리뷰 수정 완료!`,reviewId : reviewId, userId : userId};
}

const deleteReview = async(deleteReviewInfo) => {
	const {reviewId,userId} = deleteReviewInfo
	const [reviewRows,userfields] = await db.execute(
		`SELECT * from review
		where reviewId = '${reviewId}'`,
		)
	
	if(checkValidReview(reviewRows, userId, reviewId)){
		return checkValidReview(reviewRows, userId, reviewId);
	}
	
	let givenPoint = reviewRows[0].givenPoint
	await db.execute(
		`DELETE FROM review WHERE reviewId = "${reviewId}"`,
	)
	await plusOrMinusPoint(userId, -(givenPoint))
	await pointLogger(deleteReviewInfo,-givenPoint)

	return {message : `리뷰가 삭제되었습니다.`,reviewId : reviewId, userId : userId};
}

const isAlreadyReviewed = async (userId,placeId) =>{
	const [rows,fields] = await db.execute(
		`SELECT * from review
		where userId = '${userId}'
		and placeId = '${placeId}'`,
	)
	
	return rows.length > 0? true : false

}

const isFristReviewInplace = async (reviewId,placeId) => {
	const [reviewRows,fields] = await db.execute(
		`SELECT * from review
		where placeId = '${placeId}'
		ORDER BY addTime`,
	)

	return reviewRows.length === 0 || reviewRows[0].reviewId === reviewId ? true : false

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
			return 0;
	}
}

const plusOrMinusPoint = async(userId,givenpoint) => {
	const [userRows,fields] = await db.execute(
		`SELECT * from user
		WHERE userId = '${userId}'`
	)

	let preUserPoint = userRows[0].point

	await db.query(
		`UPDATE user SET point = ${preUserPoint}+${givenpoint} where userId = '${userId}'`)
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

const checkValidReview = (curReview, modUserId, reviewId) =>{
	if(curReview.length === 0){
		return {message : "리뷰가 존재하지 않습니다.",reviewId : reviewId, userId : modUserId}
	}else if(curReview[0].userId != modUserId){
		return {message : "게시글 작성자가 아닙니다.",reviewId : reviewId, userId : modUserId}
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
	pointCount
}