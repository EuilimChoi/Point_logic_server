# backend homework info
## 사용 라이브러리 버전
|name|version|
|----|-------|
|node|v16.14.0|
|npm|8.3.1|
|express|4.18.1|
|mysql|8.0.29|

## 사용법
- 본 레파지토리의 triple_server 경로에서 터미널에 npm install으로 필요한 라이브러리를 설치합니다.
- triple_server 경로의 .env.exam 내용을 확인하시고 사용하시는 mysql의 user,password를 입력하시고 사용하실 port를 입력하세요. (port를 입력하지 않으시면 3000번을 사용하게됩니다.)
- .env.exam 파일명을 .env로 바꾸신후 npm run start로 서버를 구동할 수 있습니다.
- 서버 구동시 미리 세팅해두었던 데이터베이스의 테이블이 세팅되며 더미 데이터 (userId, placeId)가 삽입됩니다.
- npm run test로 testcase를 실행할 수 있습니다.
- npm run coverage로 테스트 커버리지를 확인할 수 있습니다. 

## 주의사항
### post /events
- 단체/개인의 포인트 정보를 다루기 위해 post 요청을 배열로 감싼 후 post 요청을 진행하도록 제작했습니다.
  post body sample for multiple request :
  ```javascript
    [{
  "type": "REVIEW",
  "action": "ADD",
  "reviewId": "240a0658-dc5f-4878-9381-ebb7b2667774",
  "content": "sdfsdfsdfsdf",
  "attachedPhotoIds": ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
   "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f747",
   "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
  },{
  "type": "REVIEW",
  "action": "MOD",
  "reviewId": "240a0658-dc5f-4878-9381-ebb7b2667774",
  "content": "",
  "attachedPhotoIds": "",
   "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f747",
   "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
  },{
  "type": "REVIEW",
  "action": "MOD",
  "reviewId": "240a0658-dc5f-4878-9381-ebb7b2667774",
  "content": "",
  "attachedPhotoIds": ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
   "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f747",
   "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
  }]
  ```
  
  post body sample for single request :
  ```javascript
    [{
  "type": "REVIEW",
  "action": "ADD",
  "reviewId": "240a0658-dc5f-4878-9381-ebb7b2667774",
  "content": "sdfsdfsdfsdf",
  "attachedPhotoIds": ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-851d-4a50-bb07-9cc15cbdc332"],
   "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f747",
   "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
  }]
  ```
  
  ### get /getuserpoint/:userId
  - 조회하고 싶은 userId를 파라미터로 get요청을 보내시면 해당하는 결과를 확인하실 수 있습니다.
    URL sample : 
    ```javascript
    http://localhost:3000/getuserpoint/3ede0ef2-92b7-4817-a5f3-0c575361f745
    ```
  
