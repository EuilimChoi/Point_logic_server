const {chai} = require('chai');
const chaiHttp = require('chai-http');
const request = require('supertest')
const { expect } = require('chai');
const db = require("../database/config");
const server = require('../app');
const axios = require('axios');

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

const getUserPoint = require('../controllers/checkpoint')
const createDB = require('../database/createDB_Table')

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
      await db.execute(
        `DELETE from review`
      )
    })
  })

  describe('리뷰를 추가하고 포인트가 제대로 쌓이는지를 테스트 합니다. addReview 함수를 테스트 합니다.', async () => {
      it('신규 리뷰가 잘 등록되야 합니다.', async () => { 
        expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
        const [reviewRows, fields] = await db.execute(`SELECT * FROM review WHERE reviewId = '${reviewInfo.reviewId}'`)
        expect(reviewRows.length).to.eql(1);
      })

      it('리뷰가 잘 등록되었다면 그에 해당하는 포인트도 잘 정립되어야 합니다.', async () => { 
        const [reviewRows, fields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
        expect(reviewRows[0].point).to.above(0);
      })

      it('같은 지역에 같은 유저가 다시 리뷰를 남길 수 없어야 합니다.', async () => { 
        expect(await addReview(reviewInfo)).to.eql("이미 리뷰를 작성하셨습니다.");
        const [reviewRows, fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
        expect(reviewRows.length).to.eql(1);
      })
      
      after( async () => {
        await db.execute(
          `DELETE from review`
        )
        await db.execute(
          `DELETE from pointlog`
        )
        await db.query(
          `UPDATE user SET point = 0`)
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

      expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
      expect(await modReview(testReviewInfo)).to.eql("리뷰 수정 완료!");

      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${testReviewInfo.placeId}' and userId = '${testReviewInfo.userId}'`)
      expect(reviewRows[0].content.length).to.eql(0);
      expect(JSON.parse(reviewRows[0].attachedPhotoIds).length).to.eql(0);
    })

    it('수정된 리뷰에 따른 포인트가 다시 적립되여야 합니다.', async () => { 
      
      await db.execute(
        `DELETE from review`
      )
      await db.execute(
        `DELETE from pointlog`
      )
      await db.query(
        `UPDATE user SET point = 0`)
      
      
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }
      expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
      console.log(reviewRows[0].givenPoint)
      expect(await modReview(testReviewInfo)).to.eql("리뷰 수정 완료!");
      const [modreviewRows,modfields] = await db.execute(`SELECT * FROM review WHERE placeId = '${testReviewInfo.placeId}' and userId = '${testReviewInfo.userId}'`)
      expect([reviewRows[0].givenPoint, modreviewRows[0].givenPoint]).to.eql([3,1]);
    })

    after( async () => {
      await db.execute(
        `DELETE from review`
      )
      await db.execute(
        `DELETE from pointlog`
      )
      await db.query(
        `UPDATE user SET point = 0`)
    })

  });

  describe('리뷰를 추가하고 포인트가 제대로 쌓이는지를 테스트 합니다. addReview 함수를 테스트 합니다.', async () => {
      it('신규 리뷰가 잘 등록되야 합니다.', async () => { 
        expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
        const [reviewRows, fields] = await db.execute(`SELECT * FROM review WHERE reviewId = '${reviewInfo.reviewId}'`)
        expect(reviewRows.length).to.eql(1);
      })

      it('리뷰가 잘 등록되었다면 그에 해당하는 포인트도 잘 정립되어야 합니다.', async () => { 
        const [reviewRows, fields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
        expect(reviewRows[0].point).to.above(0);
      })

      it('같은 지역에 같은 유저가 다시 리뷰를 남길 수 없어야 합니다.', async () => { 
        expect(await addReview(reviewInfo)).to.eql("이미 리뷰를 작성하셨습니다.");
        const [reviewRows, fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
        expect(reviewRows.length).to.eql(1);
      })
      
      after( async () => {
        await db.execute(
          `DELETE from review`
        )
        await db.execute(
          `DELETE from pointlog`
        )
        await db.query(
          `UPDATE user SET point = 0`)
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

      expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
      expect(await modReview(testReviewInfo)).to.eql("리뷰 수정 완료!");

      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${testReviewInfo.placeId}' and userId = '${testReviewInfo.userId}'`)
      expect(reviewRows[0].content.length).to.eql(0);
      expect(JSON.parse(reviewRows[0].attachedPhotoIds).length).to.eql(0);
    })

    it('수정된 리뷰에 따른 포인트가 다시 적립되여야 합니다.', async () => { 
      
      await db.execute(
        `DELETE from review`
      )
      await db.execute(
        `DELETE from pointlog`
      )
      await db.query(
        `UPDATE user SET point = 0`)
      
      
      const testReviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "",
        attachedPhotoIds : "",
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
      }
      expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
      expect(await modReview(testReviewInfo)).to.eql("리뷰 수정 완료!");
      const [modreviewRows,modfields] = await db.execute(`SELECT * FROM review WHERE placeId = '${testReviewInfo.placeId}' and userId = '${testReviewInfo.userId}'`)
      expect([reviewRows[0].givenPoint, modreviewRows[0].givenPoint]).to.eql([3,1]);
    })

    after( async () => {
      await db.execute(
        `DELETE from review`
      )
      await db.execute(
        `DELETE from pointlog`
      )
      await db.query(
        `UPDATE user SET point = 0`)
    })
  });
  //=============================================================
  describe('리뷰를 삭제하고 포인트가 제대로 회수 되는지를 테스트 합니다. deleteReview 함수를 테스트 합니다.', async () => {
    it('리뷰가 잘 삭제되어야 합니다.', async () => { 
      expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
      expect(await deleteReview(reviewInfo)).to.eql("리뷰가 삭제되었습니다.");
      const [reviewRows,fields] = await db.execute(`SELECT * FROM review WHERE placeId = '${reviewInfo.placeId}' and userId = '${reviewInfo.userId}'`)
      expect(reviewRows.length).to.eql(0);

    })

    it('리뷰가 삭제되면 포인트를 회수해야합니다.', async () => { 
      expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
      const [userRows,fields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
      expect(await deleteReview(reviewInfo)).to.eql("리뷰가 삭제되었습니다.");
      const [afterDelRows,afterDelfields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
      expect([userRows[0].point,afterDelRows[0].point]).to.eql([3,0])
    })

    after( async () => {
      await db.execute(
        `DELETE from review`
      )
      await db.execute(
        `DELETE from pointlog`
      )
      await db.query(
        `UPDATE user SET point = 0`)
    })
  })
  describe('최상위 함수인 postEvents 함수를 테스트 합니다.', async () => {
    it('ADD action을 테스트 합니다.' , async () => { 
      const AddreviewInfo = {
        type: "REVIEW",
        action: "ADD",
        reviewId: "240a0658-dc5f-4878-9381-ebb7b2667773",
        content: "좋아요!",
        attachedPhotoIds : '["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"]',
        userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745",
        placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00g"
        }
      
      request(server)
        .post('/events')
        .send(AddreviewInfo)
        .end((err,res)=>{
          console.log(res);
          expect();
          done();
          if (err){
            return done(err)
          }
      });

    })

    // it('리뷰가 삭제되면 포인트를 회수해야합니다.', async () => { 
    //   expect(await addReview(reviewInfo)).to.eql("리뷰 작성 완료!");
    //   const [userRows,fields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
    //   expect(await deleteReview(reviewInfo)).to.eql("리뷰가 삭제되었습니다.");
    //   const [afterDelRows,afterDelfields] = await db.execute(`SELECT * FROM user WHERE userId = '${reviewInfo.userId}'`)
    //   expect([userRows[0].point,afterDelRows[0].point]).to.eql([3,0])
    // })

  after( async () => {
    await db.execute(
      `DELETE from review`
    )
    await db.execute(
      `DELETE from pointlog`
    )
    await db.query(
      `UPDATE user SET point = 0`)
  })
  });

    after(() => {
    console.log('\n' + '='.repeat(80))
    })
  })