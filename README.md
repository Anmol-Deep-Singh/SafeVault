# SafeVault

A secure and efficient digital transaction management system that enables users to perform secure transactions while providing administrative controls for enhanced security and monitoring.

## Features

- Secure user authentication and authorization
- Transaction management with real-time processing
- Admin dashboard for user management and monitoring
- Permanent account deletion capabilities
- Comprehensive API documentation
- Security measures including password verification and admin authentication

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SafeVault.git
cd SafeVault
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@safevault.com
ADMIN_PASSWORD=secure_admin_password
```

4. Start the application:
```bash
npm start
```

## API Documentation

### Authentication Routes

#### User Login
```http
POST /api/auth/login
```
Request body:
```json
{
    "email": "user@example.com",
    "password": "userpassword"
}
```

#### Admin Login
```http
POST /api/admin/login
```
Request body:
```json
{
    "email": "admin@safevault.com",
    "password": "adminpassword"
}
```

### User Routes

#### Get All Users (Admin)
```http
GET /api/admin/users
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Delete Own Account
```http
DELETE /api/users/delete
```
Headers:
```
Authorization: Bearer {user_token}
```
Request body:
```json
{
    "password": "current_password"
}
```

### Admin Routes

#### Permanently Delete User
```http
DELETE /api/admin/users/:username/delete
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Get Flagged and Banned Users
```http
GET /api/admin/users/flagged-banned
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Ban User
```http
POST /api/admin/users/:userId/ban
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Flag User
```http
POST /api/admin/users/:userId/flag
```
Headers:
```
Authorization: Bearer {admin_token}
```

### Transaction Routes

#### Get All Transactions (Admin)
```http
GET /api/admin/transactions
```
Headers:
```
Authorization: Bearer {admin_token}
```

### Email Management Routes

#### Get All Emails (Admin)
```http
GET /api/admin/emails
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Get Email by ID (Admin)
```http
GET /api/admin/emails/:emailId
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Delete Email (Admin)
```http
DELETE /api/admin/emails/:emailId
```
Headers:
```
Authorization: Bearer {admin_token}
```

#### Mark Email as Read (Admin)
```http
PATCH /api/admin/emails/:emailId/read
```
Headers:
```
Authorization: Bearer {admin_token}
```

## Response Formats

All API responses follow this general format:

### Success Response
```json
{
    "message": "Operation successful",
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "error": "Error message",
    "details": "Detailed error information"
}
```

## Security Features

- JWT-based authentication
- Password hashing using bcrypt
- Admin authentication middleware
- Request validation
- Error handling and logging
- Secure password verification for account deletion

## Author

**Anmoldeep Singh**
- GitHub: [github.com/anmoldeepsingh](https://github.com/anmoldeepsingh)
- LinkedIn: [linkedin.com/in/anmoldeepsingh](https://linkedin.com/in/anmoldeepsingh)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.