# SafeVault

A secure and efficient digital wallet and cryptocurrency management system that enables users to perform secure transactions while providing administrative controls for enhanced security and monitoring.

## Features

- 🔒 Secure user authentication and authorization with JWT
- 💸 Real-time cryptocurrency transactions and conversions
- 📊 Live cryptocurrency price tracking
- 🎯 Transaction monitoring and fraud detection
- 👥 User management with ban/flag capabilities
- 📱 Mobile-friendly API design
- 🔍 Comprehensive transaction history
- 📄 PDF report generation
- 🛡️ Advanced security measures

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 8.0.0
- npm or yarn

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Anmol-Deep-Singh/SafeVault.git
cd SafeVault
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/safeVault
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@safevault.com
ADMIN_PASSWORD=secure_admin_password
```

4. **Start MongoDB**
Ensure MongoDB is running on your system:
```bash
mongod
```

5. **Run the application**
Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Project Structure

```
safevault/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   └── jobs/          # Scheduled jobs
├── reports/           # Generated reports
├── app.js            # Application entry point
├── package.json      # Project metadata
└── README.md         # Project documentation
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoints and usage.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- Transaction validation
- Fraud detection system
- Admin authorization levels
- Banned user checks

## Development

```bash
# Run in development mode
npm run dev

# Lint code
npm run lint

# Run tests (when implemented)
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

**Anmoldeep Singh**
- GitHub: [github.com/anmoldeepsingh](https://github.com/anmoldeepsingh)
- LinkedIn: [linkedin.com/in/anmoldeepsingh](https://linkedin.com/in/anmoldeepsingh)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.