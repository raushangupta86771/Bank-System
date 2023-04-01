This is an API endpoint to create a new user account. The request body should contain the user's username, password, and pin. The response will contain a message indicating whether the user was created successfully or not.

1. API endpoint to create a new user account
localhost:5000/signup

body
{
"username": "raushan",
"password": "password123",
"pin":"123456"
}

response
{
  "msg": "User created"
}
 
![image](https://user-images.githubusercontent.com/97835784/229308268-37151ebe-1eb3-4b07-89dc-e41cfa6ff91e.png)

![image](https://user-images.githubusercontent.com/97835784/229308275-7a8f6222-e93e-4812-b70b-0a565bd5e024.png)

 



2. Request body containing the user's username and password

This is a request body containing the user's username and password. The response will contain an authorization token that can be used to access protected routes.

Request:
{
"username": "raushan",
"password": "password123",
"pin":"123456"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Mjg2NWE5MTRkZTRkMWQwYjliMzFmNCIsImlhdCI6MTY4MDM2OTI3NX0.Pn326IUbN0lrnaePRN2CBoJDS0v4tUfyTaPK41ADc8I"
}

![image](https://user-images.githubusercontent.com/97835784/229308278-0e4a139f-c77d-46f5-9a9b-939fe0ece88e.png)

 


3. API endpoint to view user profile

This is an API endpoint to view a user's profile. The request should contain an authorization token in the header. The response will contain the user's username, wallet balance, and transactions.

GET localhost:5000/profile
// Header containing the authorization token

Headers:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response containing user's username, wallet balance, and transactions

Response:
{
"username": "raushan",
"wallet": 0,
"transactions": []
}
 
![image](https://user-images.githubusercontent.com/97835784/229308281-a10824e0-cadd-4581-b3f6-558b28277441.png)



4. API endpoint to add money to user's wallet using a 6-digit PIN

This is an API endpoint to add money to a user's wallet using a 6-digit PIN. The request should contain the user's username, the amount to be added, and the 6-digit PIN. The response will contain a message indicating whether the transaction was successful or not.

localhost:5000/add-money

Request:
{
"username": "raushan",
"amount": 500,
"pin": "123456"
}

// Response containing a success message
Response:
{
"message": "Money added successfully"
}

![image](https://user-images.githubusercontent.com/97835784/229308289-b4728d3c-5a81-4bde-9af8-be9e59bb2617.png)
![image](https://user-images.githubusercontent.com/97835784/229308296-f4bf6eba-69b2-4fae-b838-b6e5b40477f5.png)
 


5. API endpoint to pay money from user's wallet to another user's wallet

This is an API endpoint to pay money from a user's wallet to another user's wallet. The request should contain the sender's username, the receiver's username, and the amount to be transferred. The response will contain a message indicating whether the transaction was successful or not.

localhost:5000/pay-money
 ![image](https://user-images.githubusercontent.com/97835784/229308309-8853ae10-8dfa-4cba-b853-fafe2bdcf95d.png)


6. API endpoint for admin to view all user accounts

This is an API endpoint for an admin to view all user accounts. The request should contain an authorization token in the header. The response will contain a list of all user accounts.

GET : localhost:5000/admin

![image](https://user-images.githubusercontent.com/97835784/229308316-a08f6908-42eb-42c6-8665-fea82fb882af.png)

