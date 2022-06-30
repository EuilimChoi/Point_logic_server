const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const db = require("../database/config");
const app = require('../app.js');
chai.use(chaiHttp);

const {    
  postEvents,
  addReview,
  modReview,
  deleteReview,
  isAlreadyReviewed,
  isFristReviewInplace,
  addPointRule,
  plusOrMinusPoint,
  pointCount } = require('../controllers/events')

const pointLogger = require('../config/logger.point')

const getUserPoint = require('../controllers/getUserPoint')
const createDB = require('../database/createDB_Table');
const { Server, TableInheritance } = require('typeorm');
const { end } = require('../database/config');
const { log } = require('debug');

const reviewInfo = {
  type: "REVIEW",
  action: "ADD",
  reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
  content: "좋아요!",
  attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
  userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
  placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
  }


describe('🚀 각 함수들을 테스트 합니다.', async() => {
  before(useDB = async () => {
    await createDB()
    await db.execute(`DELETE from review`)
    await db.execute(`DELETE from pointlog`)
    await db.query(`UPDATE user SET point = 0`)
  })

  describe('지역 별로 첫번째 리뷰인지를 확인하는 isFristReviewInplace 함수를 테스트 합니다.', async () => {
    it('지역별 첫번째 리뷰가 맞는 경우', async () => { 
      expect(await isFristReviewInplace(reviewInfo.reviewId, reviewInfo.placeId)).to.be.true;
    })

    it('지역별 첫번째 리뷰가 아닌 경우', async () => { 
      await db.execute(
        `INSERT INTO review (reviewId, content, userId, placeId, attachedPhotoIds)
        VALUES ("2e4baf1c-5acb-4efb-a1af-eddada31b00h","${reviewInfo.content}", "${reviewInfo.userId}","${reviewInfo.placeId}",'${reviewInfo.attachedPhotoIds}')`
      )
      expect(await isFristReviewInplace(reviewInfo.reviewId, reviewInfo.placeId)).to.be.false;
    })

    after( async () => {
      await db.execute(
        `DELETE from review`
      )
    })

  });

  describe('유저는 한 지역에 하나의 리뷰만 남길 수 있습니다. isAlreadyReviewed 함수를 테스트 합니다', async () => {
    it('지역별 하나의 리뷰만 작성한 경우', async () => { 
      expect(await isAlreadyReviewed(reviewInfo.userId, reviewInfo.placeId)).to.be.false;
    })

    it('지역별 하나 이상의 리뷰를 작성하려는 경우', async () => { 
      await db.execute(
        `INSERT INTO review (reviewId, content, userId, placeId, attachedPhotoIds)
        VALUES ("2e4baf1c-5acb-4efb-a1af-eddada31b00h","${reviewInfo.content}", "${reviewInfo.userId}","${reviewInfo.placeId}",'${reviewInfo.attachedPhotoIds}')`
      )
      expect(await isAlreadyReviewed(reviewInfo.userId, reviewInfo.placeId)).to.be.true;
    })

    after(async () => {
      await db.execute(
        `DELETE from review`
      )
      })
  });

  describe('유저에게 포인트를 주거나 회수하는 plusOrMinusPoint 함수를 테스트 합니다', async () => {
    it('포인트를 추가하는 경우', async () => { 
      
      const [curUserRows,curUserfields] = await db.execute(
        `SELECT * from user
        WHERE userId = '${reviewInfo.userId}'`
        )
      let curUserPoint = curUserRows[0].point

      await plusOrMinusPoint(reviewInfo.userId, 1)

      const [afterUserRows,afterUserfields] = await db.execute(
        `SELECT * from user
        WHERE userId = '${reviewInfo.userId}'`
        )
      let afterUserPoint = afterUserRows[0].point

      expect([curUserPoint,afterUserPoint]).to.eql([0,1]);
    })

    it('포인트를 회수하는 경우', async () => { 
      const [curUserRows,curUserfields] = await db.execute(
        `SELECT * from user
        WHERE userId = '${reviewInfo.userId}'`
        )
      let curUserPoint = curUserRows[0].point

      await plusOrMinusPoint(reviewInfo.userId, -1)

      const [afterUserRows,afterUserfields] = await db.execute(
        `SELECT * from user
        WHERE userId = '${reviewInfo.userId}'`
        )
      let afterUserPoint = afterUserRows[0].point

      expect([curUserPoint,afterUserPoint]).to.eql([1,0]);
    })

    after( async () => {
      await db.query(
        `UPDATE user SET point = 0`)
    })
  });

  describe('요청에 따라 유저에게 부여하는 포인트를 계산하는 pointCount 함수를 테스트 합니다.', async () => {
    it('지역에 최초 리뷰일 경우 1점, 콘텐츠 내용 없을 시 0점, 사진 없을시 0점, 총 1 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 

      expect(await pointCount(testReviewInfo)).to.eql(1);
    })
    it('지역에 최초 리뷰일 경우 1점, 콘텐츠 내용 없음 0점, 사진 있음 1점, 총 2 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667774",
        content: "",
        attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 

      expect(await pointCount(testReviewInfo)).to.eql(2);
    })

    it('지역에 최초 리뷰일 경우 1점, 콘텐츠 내용 있음 1점, 사진 없음 0점, 총 2 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667774",
        content: "좋아요!!",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 

      expect(await pointCount(testReviewInfo)).to.eql(2);
    })

    it('지역에 최초 리뷰일 경우 1점, 콘텐츠 내용 있음 1점, 사진 있음 1점, 총 3 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "좋아요!!",
        attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 

      expect(await pointCount(testReviewInfo)).to.eql(3);
    })

    it('지역에 최초 리뷰가 아닐 경우 0점, 콘텐츠 내용 있음 0점, 사진 있음 0점, 총 0 점', async () => { 
      const reviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "svbsdsdbsdbsdbsdb",
        attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }

      await db.query(
        `INSERT INTO review (reviewId, content, userId, placeId, attachedPhotoIds, givenPoint)
			  VALUES ("${reviewInfo.reviewId}","${reviewInfo.content}", "${reviewInfo.userId}","${reviewInfo.placeId}",'${reviewInfo.attachedPhotoIds}', 3)`
      )

      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667774",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f746",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      } 

      expect(await pointCount(testReviewInfo)).to.eql(0);

      
    })

    it('지역에 최초 리뷰가 아닐 경우 0점, 콘텐츠 내용 있음 0점, 사진 있음 1점, 총 1 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667774",
        content: "",
        attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 

      expect(await pointCount(testReviewInfo)).to.eql(1);
    })

    it('지역에 최초 리뷰일 아닐 경우 0점, 콘텐츠 내용 있음 1점, 사진 있음 0점, 총 1 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667774",
        content: "좋아요!",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 
      expect(await pointCount(testReviewInfo)).to.eql(1);
    })

    it('지역에 최초 리뷰가 아닐 경우 0점, 콘텐츠 내용 있음 1점, 사진 있음 1점, 총 2 점', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667774",
        content: "좋아요!",
        attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        } 

      expect(await pointCount(testReviewInfo)).to.eql(2);
    })

    after( async () => {
      await db.execute(`DELETE from review`)
    })
  })

  describe('리뷰를 추가하고 포인트가 제대로 쌓이는지를 테스트 합니다. addReview 함수를 테스트 합니다.', async () => {
      it('신규 리뷰가 잘 등록되야 합니다.', async () => { 
        expect(await addReview(reviewInfo)).to.deep.include({message : "리뷰 작성 완료!"});
        const [reviewRows, fields] = await db.execute(`SELECT * FROM review WHERE reviewId = '${reviewInfo.reviewId}'`)
        expect(reviewRows.length).to.eql(1);
      })

      it('리뷰가 잘 등록되었다면 그에 해당하는 포인트도 잘 정립되어야 합니다.', async () => { 
        const [reviewRows, fields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
        expect(reviewRows[0].point).to.above(0);
      })

      it('같은 지역에 같은 유저가 다시 리뷰를 남길 수 없어야 합니다.', async () => { 
        expect(await addReview(reviewInfo)).to.deep.include({message : "이미 리뷰를 작성하셨습니다."});
        const [reviewRows, fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
        expect(reviewRows.length).to.eql(1);
      })
      
      after( async () => {
        await db.execute(`DELETE from review`)
        await db.execute(`DELETE from pointlog`)
        await db.query(`UPDATE user SET point = 0`)
      })
  });

  describe('리뷰를 수정하고 그에 따른 포인트가 추가 또는 회수 되는지 테스트 합니다. modReview 함수를 테스트 합니다.', async () => {
    it('리뷰가 잘 수정되어야 합니다.', async () => { 
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      expect(await addReview(reviewInfo)).to.deep.include({message : "리뷰 작성 완료!"});
      expect(await modReview(testReviewInfo)).to.deep.include({message : "리뷰 수정 완료!"});

      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${testReviewInfo.placeId}' and userId = '${testReviewInfo.userId}'`)
      expect(reviewRows[0].content.length).to.eql(0);
      expect(reviewRows[0].attachedPhotoIds.length).to.eql(0);
    })

    it('수정된 리뷰에 따른 포인트가 다시 적립되여야 합니다.', async () => { 
      
      await db.execute(`DELETE from review`)
      await db.execute(`DELETE from pointlog`)
      await db.query(`UPDATE user SET point = 0`)
      
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }
      expect(await addReview(reviewInfo)).to.deep.include({message : "리뷰 작성 완료!"});
      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
      expect(await modReview(testReviewInfo)).to.deep.include({message : "리뷰 수정 완료!"});
      const [modreviewRows,modfields] = await db.execute(`SELECT * FROM review WHERE placeId = '${testReviewInfo.placeId}' and userId = '${testReviewInfo.userId}'`)
      expect([reviewRows[0].givenPoint, modreviewRows[0].givenPoint]).to.eql([3,1]);
    })

    after(async () => {
      await db.execute(`DELETE from review`)
      await db.execute(`DELETE from pointlog`)
      await db.query(`UPDATE user SET point = 0`)
    })
  });

  //=============================================================
  describe('리뷰를 삭제하고 포인트가 제대로 회수 되는지를 테스트 합니다. deleteReview 함수를 테스트 합니다.', async () => {
    it('리뷰가 잘 삭제되어야 합니다.', async () => { 
      expect(await addReview(reviewInfo)).to.deep.include({message : "리뷰 작성 완료!"});
      expect(await deleteReview(reviewInfo)).to.deep.include({message : "리뷰가 삭제되었습니다."});
      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
      expect(reviewRows.length).to.eql(0);
    })

    it('리뷰가 삭제되면 포인트를 회수해야합니다.', async () => { 
      expect(await addReview(reviewInfo)).to.deep.include({message : "리뷰 작성 완료!"});
      const [userRows,fields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
      expect(await deleteReview(reviewInfo)).to.deep.include({message : "리뷰가 삭제되었습니다."});
      const [afterDelRows,afterDelfields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
      expect([userRows[0].point,afterDelRows[0].point]).to.eql([3,0])
    })

    after( async () => {
      await db.execute(`DELETE from review`)
      await db.execute(`DELETE from pointlog`)
      await db.execute(`UPDATE user SET point = 0`)
    })
  })

  describe('최상위 함수인 postEvents 함수를 테스트 합니다.', async () => {
    const checkReview = async () => {
      const [reviewRows,userfields] = await db.execute(
        `SELECT * from review`)
      return reviewRows.length
    }
    describe('ADD action을 테스트 합니다.', async () =>{
      it('ADD 요청을 보내 리뷰와 포인트가 추가되는지 확인합니다.' , (done) => { 
        const AddTestReviewInfo = [{
          type: "REVIEW",
          action: "ADD",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "좋아요!",
          attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        chai.request(app)
          .post('/events')
          .send(AddTestReviewInfo)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message : "리뷰 작성 완료!"})
            expect(await checkReview()).to.eql(1)
          })
          .then(done)
          .catch(done)
      })

      it('같은 지역에 같은 유저가 리뷰를 작성할 수 없습니다.' , (done) => { 
  
        const AddTestReviewInfo = [{
          type: "REVIEW",
          action: "ADD",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "좋아요!",
          attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        chai.request(app)
          .post('/events')
          .send(AddTestReviewInfo)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"이미 리뷰를 작성하셨습니다."})
            expect(await checkReview()).to.eql(1)
          })
          .then(done)
          .catch(done)

      })

      it('유효하지 않은 유저 (user 테이블에 존재하지 않는 유저)가 리뷰를 추가할 수 없습니다.' , (done) => { 
 

        const AddTestReviewInfo = [{
          type: "REVIEW",
          action: "ADD",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "좋아요!",
          attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "유효하지 않는 유저",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        chai.request(app)
          .post('/events')
          .send(AddTestReviewInfo)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"유효하지 않는 유저입니다."})
            expect(await checkReview()).to.eql(1)
          })
          .then(done)
          .catch(done)
      })
    })

    describe('MOD action을 테스트 합니다.', async () =>{
      it('MOD 요청으로 Content가 수정되는지 테스트 합니다.' , (done) => { 
 
        const modTestReviewInfo1 = [{
          type: "REVIEW",
          action: "MOD",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "새로운 콘텐츠!",
          attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        const checkReviewInfo = async () => {
          const [reviewRows,userfields] = await db.execute(
            `SELECT * from review`
          )
          return reviewRows[0].content
        }

        chai.request(app)
          .post('/events')
          .send(modTestReviewInfo1)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"리뷰 수정 완료!"})
            expect(await checkReview()).to.eql(1)
            expect(await checkReviewInfo()).to.eql("새로운 콘텐츠!")
          })
          .then(done)
          .catch(done)
      })

      it('MOD 요청으로 attachedPhotoIds가 수정되는지 테스트 합니다.' , (done) => { 
 

        const modTestReviewInfo1 = [{
          type: "REVIEW",
          action: "MOD",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "새로운 콘텐츠!",
          attachedPhotoIds : '["afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        const checkReviewInfo = async () => {
          const [reviewRows,userfields] = await db.execute(
            `SELECT * from review`
          )
          return reviewRows[0].attachedPhotoIds
        }

        chai.request(app)
          .post('/events')
          .send(modTestReviewInfo1)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"리뷰 수정 완료!"})
            expect(await checkReview()).to.eql(1)
            expect(await checkReviewInfo()).to.eql('["afb0cef2-851d-4a50-bb07-9cc15cbdc332"]')
          })
          .then(async (res, err) => {
          }
          )
          .then(done)
          .catch(done)
      })

      it('리뷰 작성자가 아니면 리뷰를 수정 할 수 없습니다.' , (done) => { 


        const modTestReviewInfo1 = [{
          type: "REVIEW",
          action: "MOD",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "새로운 콘텐츠!",
          attachedPhotoIds : '["afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "다른 유저",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        chai.request(app)
          .post('/events')
          .send(modTestReviewInfo1)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"게시글 작성자가 아닙니다."})
            expect(await checkReview()).to.eql(1)
          })
          .then(done)
          .catch(done)
      })

    })

    describe('DELETE action을 테스트 합니다.', async () =>{
      it('리뷰 작성자가 아니면 리뷰를 삭제할 수 없습니다.' , (done) => { 
 
        const modTestReviewInfo1 = [{
          type: "REVIEW",
          action: "DELETE",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "새로운 콘텐츠!",
          attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "다른 유저",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        chai.request(app)
          .post('/events')
          .send(modTestReviewInfo1)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"게시글 작성자가 아닙니다."})
            expect(await checkReview()).to.eql(1)
          })
          .then(done)
          .catch(done)
      })

      it('리뷰가 잘 삭제되어야 합니다.' , (done) => { 
 

        const modTestReviewInfo1 = [{
          type: "REVIEW",
          action: "DELETE",
          reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
          content: "새로운 콘텐츠!",
          attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
          userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
          placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }]

        chai.request(app)
          .post('/events')
          .send(modTestReviewInfo1)
          .then(async(res, err) => {
            expect(res.body[0]).to.deep.include({message:"리뷰가 삭제되었습니다."})
            expect(await checkReview()).to.eql(0)
          })
          .then(done)
          .catch(done)
      })
    })
    

    after( async () => {
      await db.execute(`DELETE from review` )
      await db.execute(`DELETE from pointlog`)
      await db.execute(`UPDATE user SET point = 0`)
    })
  })

  describe('포인트 변동에 대한 로그를 테스트합니다. pointLogger 함수를 테스트 합니다.', async () => {
    it('리뷰가 추가될 때 ', async () => { 
      const reviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "좋아요!",
        attachedPhotoIds : ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }

      await pointLogger(reviewInfo,3)
      const [logRows,fields] = await db.execute(`SELECT * FROM pointLog WHERE userId = '${reviewInfo.userId}'`) 
      let numOflog = logRows.length
      let pointChange = logRows[0].pointChange
      expect(numOflog).to.eql(1)
      expect(pointChange).to.eql(3)
    })
  //=============================================================================  
    it('리뷰가 변경될 때.', async () => { 
      let numOflog = 0
      let pointDiff = 0
      let changeDetail = ""
      
      const checkLogRows = async () => {
        const [logRows,fields] = await db.execute(`SELECT * FROM pointLog WHERE userId = '${reviewInfo.userId}'`) 
        numOflog = logRows.length
        changeDetail = logRows[numOflog-1].changeDetail
      }

      const checkPointDiff = async (modReviewInfo,reviewRows) =>{
        let currentReviewPoint = reviewRows[0].givenPoint
        let givenPointAfterMod = await pointCount(modReviewInfo)
        pointDiff = givenPointAfterMod-currentReviewPoint
      }

      const addReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "좋아요!",
        attachedPhotoIds : ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      await addReview(addReviewInfo)

      const modReviewInfo1 = {
        type: "REVIEW",
        action: "MOD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }
      
      const [reviewRows,userfields] = await db.execute(
        `SELECT * from review
        where reviewId = '${modReviewInfo1.reviewId}'`
      )

      await checkPointDiff(modReviewInfo1,reviewRows)

      await pointLogger(modReviewInfo1,pointDiff,reviewRows[0])
      
      await checkLogRows()

      expect(numOflog).to.eql(2)
      expect(pointDiff).to.eql(-1)
      expect(changeDetail).to.eql("MOD review, DELETE content")
      //=======

      const modReviewInfo2 = {
        type: "REVIEW",
        action: "MOD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "좋아요!",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      await checkPointDiff(modReviewInfo2,reviewRows)

      await pointLogger(modReviewInfo2,pointDiff,reviewRows[0])

      await checkLogRows()

      expect(numOflog).to.eql(3)
      expect(pointDiff).to.eql(-1)
      expect(changeDetail).to.eql("MOD review, DELETE photo")

      const modReviewInfo3 = {
        type: "REVIEW",
        action: "MOD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      await checkPointDiff(modReviewInfo3,reviewRows)
      await pointLogger(modReviewInfo3,pointDiff,reviewRows[0])

      await checkLogRows()

      expect(numOflog).to.eql(4)
      expect(pointDiff).to.eql(-2)
      expect(changeDetail).to.eql("MOD review, DELTE content,photo")

      await db.execute(`UPDATE review SET content = "", attachedPhotoIds = "", givenPoint = 1`)

      const modReviewInfo4 = {
        type: "REVIEW",
        action: "MOD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "콘텐츠 추가",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      const [reviewRows2,userfields2] = await db.execute(
        `SELECT * from review
        where reviewId = '${addReviewInfo.reviewId}'`
      )

      await checkPointDiff(modReviewInfo4,reviewRows2)
      await pointLogger(modReviewInfo4,pointDiff,reviewRows2[0])
      await checkLogRows()
      
      
      expect(numOflog).to.eql(5)
      expect(pointDiff).to.eql(1)
      expect(changeDetail).to.eql("MOD review, ADD content")


      const modReviewInfo5 = {
        type: "REVIEW",
        action: "MOD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "사진 추가",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      await checkPointDiff(modReviewInfo5,reviewRows2)
      await pointLogger(modReviewInfo5,pointDiff,reviewRows2[0])
      await checkLogRows()
      
      
      expect(numOflog).to.eql(6)
      expect(pointDiff).to.eql(1)
      expect(changeDetail).to.eql("MOD review, ADD photo")

      const modReviewInfo6 = {
        type: "REVIEW",
        action: "MOD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "콘텐츠 추가",
        attachedPhotoIds : "사진 추가!!!!!!!!!!!",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }

      await checkPointDiff(modReviewInfo6,reviewRows2)
      await pointLogger(modReviewInfo6,pointDiff,reviewRows2[0])
      await checkLogRows()
      
      
      expect(numOflog).to.eql(7)
      expect(pointDiff).to.eql(2)
      expect(changeDetail).to.eql("MOD review , ADD content,photo")
    })

    it('리뷰가 삭제될 때.', async () => { 
      const deleteReviewInfo = {
        type: "REVIEW",
        action: "DELETE",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "좋아요!",
        attachedPhotoIds : ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }

      const [reviewRows,userfields] = await db.execute(
        `SELECT * from review
        where reviewId = '${deleteReviewInfo.reviewId}'`
      )


      await pointLogger(deleteReviewInfo,-3)
      const [logRows,fields] = await db.execute(`SELECT * FROM pointLog WHERE userId = '${reviewInfo.userId}'`) 
      let numOflog = logRows.length
      let pointChange = logRows[0].pointChange
      expect(numOflog).to.eql(1)
      expect(pointChange).to.eql(-3)
    })
    

    afterEach( async () => {
      await db.execute(`DELETE from review`)
      await db.execute(`DELETE from pointlog`)
      await db.execute(`UPDATE user SET point = 0`)
    })
  })

  describe('유저의 포인트를 조회하는 API를 테스트 합니다.', async () => {
    before(async () => {
      await db.execute(`UPDATE user SET point = 99`)
    })

    it('GET /getuserpoint/:userId 로 유저 포인트를 조회 합니다.', (done) => { 
      chai.request(app)
          .get('/getuserpoint/3ede0ef2-92b7-4817-a5f3-0c575361f745')
          .then(async(res, err) => {
            expect(res.body.point).to.eql(99)
          })
          .then(done)
          .catch(done)
    })

    it('GET /getuserpoint/:userId 로 유저 포인트를 조회 합니다.', (done) => { 
      chai.request(app)
          .get('/getuserpoint/notexistsuser')
          .then(async(res, err) => {
            expect(res.body).to.eql('유저가 존재하지 않습니다.')
          })
          .then(done)
          .catch(done)
    })

    after(async () => {
      await db.execute(`UPDATE user SET point = 0`)
    })

  });
  after(async() => {
    await db.execute(`DELETE from review` )
    await db.execute(`DELETE from pointlog`)
    await db.execute(`UPDATE user SET point = 0`)

    console.log('\n' + '='.repeat(80))
  })
})
  