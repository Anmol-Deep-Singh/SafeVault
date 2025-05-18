---
title: SafeVault API Documentation
author: Anmoldeep Singh
date: March 2024
geometry: margin=1in
fontsize: 11pt
colorlinks: true
---

# SafeVault API Documentation

**Author:** Anmoldeep Singh  
**Version:** 1.0.0  
**Last Updated:** March 2024

## Base URL
```
http://localhost:8000/api
```

## Authentication
Most endpoints require authentication using JWT (JSON Web Token). Include the token in the request header:
```
Authorization: Bearer <your_token>
```

## API Endpoints

### Authentication Routes (`/auth`)

#### 1. Register User
- **Endpoint:** `POST /auth/register`
- **Access:** Public
- **Description:** Register a new user
- **Request Body:**
```json
{
    "fullName": "string",
    "email": "string",
    "mobileNumber": "string",
    "password": "string"
}
```
- **Response:** Returns user details and authentication token

#### 2. Login User
- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Description:** Authenticate user and get token
- **Request Body:**
```json
{
    "email": "string",
    "password": "string"
}
```
- **Response:** Returns authentication token and user details

#### 3. Get User Profile
- **Endpoint:** `GET /auth/profile`
- **Access:** Private
- **Description:** Get current user's profile with balances
- **Response:** Returns user profile and balance information

#### 4. Update Profile
- **Endpoint:** `PATCH /auth/profile`
- **Access:** Private
- **Description:** Update user profile information
- **Request Body:** Any of the following fields
```json
{
    "fullName": "string",
    "email": "string",
    "mobileNumber": "string",
    "password": "string"
}
```

### User Routes (`/api/users`)

#### 1. Get User Details and Conversion History
- **Endpoint:** `GET /api/users/:userId`
- **Access:** Private
- **Description:** Get user details, balances, and recent conversion history
- **Response:**
```json
{
    "userDetails": {
        "fullName": "string",
        "email": "string",
        "mobileNumber": "string",
        "balances": {
            "INR": "number",
            "Bitcoin": "number",
            "Ethereum": "number",
            "Dogecoin": "number"
        }
    },
    "conversionHistory": [
        {
            "timestamp": "date",
            "fromCurrency": "string",
            "toCurrency": "string",
            "amount": "number",
            "convertedAmount": "number"
        }
    ]
}
```

#### 2. Transfer Funds
- **Endpoint:** `POST /api/users/transfer/:username`
- **Access:** Private
- **Description:** Transfer funds to another user
- **URL Parameters:** username (receiver's username)
- **Request Body:**
```json
{
    "amount": "number",
    "currencyType": "string (INR/Bitcoin/Ethereum/Dogecoin)"
}
```

#### 3. Get Transaction History
- **Endpoint:** `GET /api/users/history/:userId`
- **Access:** Private
- **Description:** Get user's transaction history
- **URL Parameters:** userId (user's ID)
- **Query Parameters:**
  - `type`: "sent" | "received" (optional)
  - `page`: number (optional)
  - `limit`: number (optional)

#### 4. Get Conversion Rates
- **Endpoint:** `GET /api/users/conversion/rates`
- **Access:** Private
- **Description:** Get current currency conversion rates

#### 5. Convert Currency
- **Endpoint:** `POST /api/users/conversion/convert/:userId`
- **Access:** Private
- **Description:** Convert between currencies
- **URL Parameters:** userId (user's ID)
- **Request Body:**
```json
{
    "amount": "number",
    "fromCurrency": "string (INR/Bitcoin/Ethereum/Dogecoin)",
    "toCurrency": "string (INR/Bitcoin/Ethereum/Dogecoin)"
}
```

### Admin Routes (`/admin`)

#### 1. Admin Login
- **Endpoint:** `POST /admin/login`
- **Access:** Admin Only
- **Description:** Authenticate admin user
- **Request Body:**
```json
{
    "email": "string",
    "password": "string"
}
```

#### 2. Get All Users
- **Endpoint:** `GET /admin/users`
- **Access:** Admin Only
- **Description:** Get list of all users with their status

#### 3. Ban User
- **Endpoint:** `POST /admin/users/:userId/ban`
- **Access:** Admin Only
- **Description:** Soft ban a user
- **Request Body:**
```json
{
    "reason": "string"
}
```

#### 4. Flag User
- **Endpoint:** `POST /admin/users/:userId/flag`
- **Access:** Admin Only
- **Description:** Flag a user for suspicious activity
- **Request Body:**
```json
{
    "reason": "string"
}
```

#### 5. Get All Transactions
- **Endpoint:** `GET /admin/transactions`
- **Access:** Admin Only
- **Description:** Get all system transactions
- **Query Parameters:**
  - `page`: number (optional)
  - `limit`: number (optional)
  - `sort`: "asc" | "desc" (optional)
  - `userId`: string (optional, filter by user)

### Report Routes (`/reports`)

#### 1. Download User Report
- **Endpoint:** `GET /reports/download/:userId`
- **Access:** Private/Admin
- **Description:** Download user transaction report as PDF
- **Response:** PDF file download

## Error Responses

All endpoints follow a standard error response format:
```json
{
    "error": "Error message",
    "details": "Detailed error information (optional)"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

- API requests are limited to 100 requests per IP per hour
- Admin endpoints are limited to 50 requests per IP per hour

## Security Features

1. JWT-based authentication
2. Password hashing using bcrypt
3. Input validation and sanitization
4. Soft delete functionality for users
5. Admin authorization levels
6. Transaction validation
7. Banned user checks
8. Fraud detection system

## Data Models

### User
- fullName
- email
- mobileNumber
- password
- currency balances (INR, Bitcoin, Ethereum, Dogecoin)
- ban status
- flag status

### Transaction
- sender details
- receiver details
- amount
- currencyType
- status
- timestamp

### Admin
- adminId
- name
- email
- password
- role
- isActive
- lastLogin

## Support

For any API related queries or issues, please contact:
- **Developer:** Anmoldeep Singh
- **Email:** anmoldeepsingh.work@gmail.com
- **GitHub:** https://github.com/anmoldeep1512

---
*© 2024 SafeVault. All rights reserved.* 