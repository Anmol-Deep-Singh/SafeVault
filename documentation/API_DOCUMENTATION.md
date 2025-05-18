---
title: SafeVault API Documentation
author: Anmoldeep Singh
date: March 2024
geometry: margin=1in
fontsize: 11pt
colorlinks: true
---

# SafeVault API Documentation

## Overview

SafeVault provides a RESTful API for secure digital wallet and cryptocurrency management. This document outlines all available endpoints, their usage, and expected responses.

**Author:** Anmoldeep Singh  
**Version:** 1.0.0  
**Last Updated:** March 2024

## Base URL
```
http://localhost:8000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the request header:
```
Authorization: Bearer <your_token>
```

## Rate Limiting
- Standard endpoints: 100 requests/hour/IP
- Admin endpoints: 50 requests/hour/IP

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
    "fullName": "string",
    "email": "string",
    "mobileNumber": "string",
    "password": "string"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "string",
    "password": "string"
}
```

### User Operations

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Transfer Funds
```http
POST /users/transfer/:username
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": "number",
    "currencyType": "string (INR/Bitcoin/Ethereum/Dogecoin)"
}
```

#### Convert Currency
```http
POST /users/conversion/convert/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": "number",
    "fromCurrency": "string",
    "toCurrency": "string"
}
```

### Admin Operations

#### Admin Login
```http
POST /admin/login
Content-Type: application/json

{
    "email": "string",
    "password": "string"
}
```

#### Manage Users
```http
GET    /admin/users                    # List all users
POST   /admin/users/:userId/ban        # Ban user
POST   /admin/users/:userId/flag       # Flag user
DELETE /admin/users/:username/delete   # Delete user
```

#### Transaction Management
```http
GET /admin/transactions
Query Parameters:
- page (default: 1)
- limit (default: 10)
- sort (asc/desc)
- userId (filter by user)
```

### Reports

#### Generate User Report
```http
GET /reports/download/:userId
Authorization: Bearer <token>
Response: PDF file
```

## Response Formats

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "Operation successful"
}
```

### Error Response
```json
{
    "success": false,
    "error": "Error message",
    "details": "Detailed error information"
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Data Models

### User
```json
{
    "fullName": "string",
    "email": "string",
    "mobileNumber": "string",
    "INR": "number",
    "Bitcoin": "number",
    "Ethereum": "number",
    "Dogecoin": "number",
    "isBanned": "boolean",
    "isFlaged": "boolean"
}
```

### Transaction
```json
{
    "sender": {
        "userId": "string",
        "fullName": "string"
    },
    "receiver": {
        "userId": "string",
        "fullName": "string"
    },
    "amount": "number",
    "currencyType": "string",
    "timestamp": "date"
}
```

## Security

1. All endpoints use HTTPS
2. Passwords are hashed using bcrypt
3. JWT tokens expire after 24 hours
4. Rate limiting prevents brute force attacks
5. Input validation prevents injection attacks
6. Transaction validation ensures data integrity

## Support

For API support, please contact:
- Email: support@safevault.com
- GitHub Issues: [github.com/anmoldeepsingh/SafeVault/issues](https://github.com/anmoldeepsingh/SafeVault/issues)

---
SAFEVAULT 