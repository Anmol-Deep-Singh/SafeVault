const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Cache for cryptocurrency prices
let priceCache = {
    timestamp: 0,
    prices: {}
};

async function getCryptoPrices() {
    const now = Date.now();
    // Cache for 1 minute
    if (now - priceCache.timestamp < 60000 && Object.keys(priceCache.prices).length > 0) {
        return priceCache.prices;
    }

    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'bitcoin,ethereum,dogecoin',
                vs_currencies: 'inr',
                include_24hr_change: true
            }
        });

        priceCache = {
            timestamp: now,
            prices: {
                Bitcoin: {
                    price: response.data.bitcoin.inr,
                    change24h: response.data.bitcoin.inr_24h_change
                },
                Ethereum: {
                    price: response.data.ethereum.inr,
                    change24h: response.data.ethereum.inr_24h_change
                },
                Dogecoin: {
                    price: response.data.dogecoin.inr,
                    change24h: response.data.dogecoin.inr_24h_change
                }
            }
        };

        return priceCache.prices;
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        return null;
    }
}

function formatCurrency(amount, currency = 'INR') {
    if (typeof amount !== 'number') return 'N/A';
    
    const value = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: currency === 'INR' ? 0 : 8,
        maximumFractionDigits: currency === 'INR' ? 0 : 8
    }).format(amount);

    // Use text codes instead of symbols
    switch (currency) {
        case 'INR':
            return `INR ${value}`;
        case 'Bitcoin':
            return `BIT ${value}`;
        case 'Ethereum':
            return `ETHE ${value}`;
        case 'Dogecoin':
            return `DOGE ${value}`;
        default:
            return `${value} ${currency}`;
    }
}

function getChangeColor(change) {
    return change >= 0 ? '#008000' : '#FF0000';
}

async function generateUserReport(user, transactions) {
    try {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        // Create reports directory if it doesn't exist
        const reportsDir = path.join(process.cwd(), 'reports', 'users');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `user_report_${user._id}_${timestamp}.pdf`;
        const filePath = path.join(reportsDir, filename);
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('SafeVault User Report', { align: 'center' })
           .moveDown();

        // User Information
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('User Information')
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Name: ${user.fullName}`)
           .text(`Email: ${user.email}`)
           .text(`Mobile: ${user.mobileNumber}`)
           .moveDown();

        // Current Portfolio
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Current Portfolio')
           .moveDown(0.5);

        // Get current crypto prices
        const cryptoPrices = await getCryptoPrices();

        // Calculate total portfolio value
        let totalPortfolioValue = user.INR;
        
        // INR Balance
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Fiat Currency:')
           .font('Helvetica')
           .text(`INR: ${formatCurrency(user.INR)}`)
           .moveDown();

        // Cryptocurrency Balances
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Cryptocurrencies:');

        const cryptos = ['Bitcoin', 'Ethereum', 'Dogecoin'];
        for (const crypto of cryptos) {
            if (cryptoPrices && cryptoPrices[crypto]) {
                const value = user[crypto] * cryptoPrices[crypto].price;
                totalPortfolioValue += value;
                
                const cryptoCode = crypto === 'Bitcoin' ? 'BIT' : 
                                 crypto === 'Ethereum' ? 'ETHE' : 
                                 'DOGE';
                
                doc.font('Helvetica')
                   .text(`${cryptoCode}: ${user[crypto]} (Value: ${formatCurrency(value, 'INR')})`)
                   .text(`Current Rate: ${formatCurrency(cryptoPrices[crypto].price, 'INR')} per ${cryptoCode}`)
                   .fillColor(getChangeColor(cryptoPrices[crypto].change24h))
                   .text(`24h Change: ${cryptoPrices[crypto].change24h.toFixed(2)}%`)
                   .fillColor('black')
                   .moveDown(0.5);
            }
        }

        // Total Portfolio Value
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(`Total Portfolio Value: ${formatCurrency(totalPortfolioValue)}`)
           .moveDown();

        // Transaction History
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Transaction History')
           .moveDown();

        if (transactions.length === 0) {
            doc.fontSize(12)
               .font('Helvetica')
               .text('No transactions found.')
               .moveDown();
        } else {
            // Group transactions by type
            const sent = transactions.filter(tx => tx.sender.userId.toString() === user._id.toString());
            const received = transactions.filter(tx => tx.receiver.userId.toString() === user._id.toString());

            // Sent Transactions
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('Sent Transactions:')
               .moveDown(0.5);

            sent.forEach((tx, index) => {
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`${index + 1}. To: ${tx.receiver.fullName}`)
                   .text(`   Amount: ${formatCurrency(tx.amount, tx.currencyType)}`)
                   .text(`   Type: ${tx.currencyType}`)
                   .text(`   Date: ${new Date(tx.timestamp).toLocaleString()}`)
                   .text(`   Description: ${tx.description || 'N/A'}`)
                   .moveDown(0.5);
            });

            // Received Transactions
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('Received Transactions:')
               .moveDown(0.5);

            received.forEach((tx, index) => {
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`${index + 1}. From: ${tx.sender.fullName}`)
                   .text(`   Amount: ${formatCurrency(tx.amount, tx.currencyType)}`)
                   .text(`   Type: ${tx.currencyType}`)
                   .text(`   Date: ${new Date(tx.timestamp).toLocaleString()}`)
                   .text(`   Description: ${tx.description || 'N/A'}`)
                   .moveDown(0.5);
            });
        }

        // Footer
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Report generated on: ${new Date().toLocaleString()}`, {
               align: 'center'
           });

        doc.end();

        return {
            success: true,
            filePath
        };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function generateAPIDocumentation() {
    try {
        console.log('Starting API documentation generation...');
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        // Create docs directory if it doesn't exist
        const docsDir = path.join(process.cwd(), 'docs');
        console.log('Creating docs directory at:', docsDir);
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `safevault_api_documentation_${timestamp}.pdf`;
        const filePath = path.join(docsDir, filename);
        console.log('PDF will be saved at:', filePath);

        // Create a promise to track when the PDF is finished
        const finishPromise = new Promise((resolve, reject) => {
            doc.on('end', () => {
                console.log('PDF generation completed');
                resolve();
            });
            doc.on('error', (err) => {
                console.error('Error during PDF generation:', err);
                reject(err);
            });
        });

        const writeStream = fs.createWriteStream(filePath);
        writeStream.on('error', (err) => {
            console.error('Error writing to file:', err);
        });
        writeStream.on('finish', () => {
            console.log('File write stream finished');
        });

        doc.pipe(writeStream);

        // Title Page
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('SafeVault API Documentation', { align: 'center' })
           .moveDown()
           .fontSize(14)
           .font('Helvetica')
           .text('Version: 1.0.0', { align: 'center' })
           .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
           .text('Author: Anmoldeep Singh', { align: 'center' })
           .moveDown(2);

        // Table of Contents
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Table of Contents')
           .moveDown();

        const sections = [
            'Overview',
            'Authentication',
            'User Operations',
            'Admin Operations',
            'Reports',
            'Data Models',
            'Security',
            'Support'
        ];

        sections.forEach((section, index) => {
            doc.fontSize(12)
               .font('Helvetica')
               .text(`${index + 1}. ${section}`, {
                   link: section.toLowerCase(),
                   underline: true,
                   color: 'blue'
               })
               .moveDown(0.5);
        });

        doc.addPage();

        // Overview Section
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('1. Overview', { destination: 'overview' })
           .moveDown();

        doc.fontSize(12)
           .font('Helvetica')
           .text('SafeVault provides a RESTful API for secure digital wallet and cryptocurrency management. The API enables users to perform secure transactions while providing administrative controls for enhanced security and monitoring.')
           .moveDown()
           .text('Base URL: http://localhost:8000/api')
           .moveDown(2);

        // Authentication Section
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('2. Authentication', { destination: 'authentication' })
           .moveDown();

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Register User')
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text('POST /auth/register')
           .moveDown(0.5)
           .font('Courier')
           .text(JSON.stringify({
               fullName: "string",
               email: "string",
               mobileNumber: "string",
               password: "string"
           }, null, 2))
           .moveDown();

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Login')
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text('POST /auth/login')
           .moveDown(0.5)
           .font('Courier')
           .text(JSON.stringify({
               email: "string",
               password: "string"
           }, null, 2))
           .moveDown(2);

        // User Operations Section
        doc.addPage();
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('3. User Operations', { destination: 'user-operations' })
           .moveDown();

        const userEndpoints = [
            {
                name: 'Get Profile',
                method: 'GET',
                endpoint: '/users/profile',
                description: 'Retrieve user profile information'
            },
            {
                name: 'Transfer Funds',
                method: 'POST',
                endpoint: '/users/transfer/:username',
                body: {
                    amount: "number",
                    currencyType: "string (INR/Bitcoin/Ethereum/Dogecoin)"
                }
            },
            {
                name: 'Convert Currency',
                method: 'POST',
                endpoint: '/users/conversion/convert/:userId',
                body: {
                    amount: "number",
                    fromCurrency: "string",
                    toCurrency: "string"
                }
            }
        ];

        userEndpoints.forEach(endpoint => {
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text(endpoint.name)
               .moveDown(0.5)
               .fontSize(12)
               .font('Helvetica')
               .text(`${endpoint.method} ${endpoint.endpoint}`)
               .moveDown(0.5);

            if (endpoint.body) {
                doc.font('Courier')
                   .text(JSON.stringify(endpoint.body, null, 2))
                   .moveDown();
            }

            if (endpoint.description) {
                doc.font('Helvetica')
                   .text(endpoint.description)
                   .moveDown();
            }
            doc.moveDown();
        });

        // Admin Operations Section
        doc.addPage();
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('4. Admin Operations', { destination: 'admin-operations' })
           .moveDown();

        const adminEndpoints = [
            {
                name: 'Admin Login',
                method: 'POST',
                endpoint: '/admin/login',
                body: {
                    email: "string",
                    password: "string"
                }
            },
            {
                name: 'List Users',
                method: 'GET',
                endpoint: '/admin/users'
            },
            {
                name: 'Ban User',
                method: 'POST',
                endpoint: '/admin/users/:userId/ban'
            },
            {
                name: 'Flag User',
                method: 'POST',
                endpoint: '/admin/users/:userId/flag'
            },
            {
                name: 'Delete User',
                method: 'DELETE',
                endpoint: '/admin/users/:username/delete'
            }
        ];

        adminEndpoints.forEach(endpoint => {
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text(endpoint.name)
               .moveDown(0.5)
               .fontSize(12)
               .font('Helvetica')
               .text(`${endpoint.method} ${endpoint.endpoint}`)
               .moveDown(0.5);

            if (endpoint.body) {
                doc.font('Courier')
                   .text(JSON.stringify(endpoint.body, null, 2))
                   .moveDown();
            }
            doc.moveDown();
        });

        // Reports Section
        doc.addPage();
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('5. Reports', { destination: 'reports' })
           .moveDown();

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Generate User Report')
           .moveDown(0.5)
           .fontSize(12)
           .font('Helvetica')
           .text('GET /reports/download/:userId')
           .moveDown()
           .text('Response: PDF file containing user transaction history and portfolio details')
           .moveDown(2);

        // Data Models Section
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('6. Data Models', { destination: 'data-models' })
           .moveDown();

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('User Model')
           .moveDown(0.5)
           .fontSize(12)
           .font('Courier')
           .text(JSON.stringify({
               fullName: "string",
               email: "string",
               mobileNumber: "string",
               INR: "number",
               Bitcoin: "number",
               Ethereum: "number",
               Dogecoin: "number",
               isBanned: "boolean",
               isFlaged: "boolean"
           }, null, 2))
           .moveDown(2);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Transaction Model')
           .moveDown(0.5)
           .fontSize(12)
           .font('Courier')
           .text(JSON.stringify({
               sender: {
                   userId: "string",
                   fullName: "string"
               },
               receiver: {
                   userId: "string",
                   fullName: "string"
               },
               amount: "number",
               currencyType: "string",
               timestamp: "date"
           }, null, 2))
           .moveDown(2);

        // Security Section
        doc.addPage();
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('7. Security', { destination: 'security' })
           .moveDown();

        const securityFeatures = [
            'All endpoints use HTTPS',
            'Passwords are hashed using bcrypt',
            'JWT tokens expire after 24 hours',
            'Rate limiting prevents brute force attacks',
            'Input validation prevents injection attacks',
            'Transaction validation ensures data integrity'
        ];

        securityFeatures.forEach(feature => {
            doc.fontSize(12)
               .font('Helvetica')
               .text(`• ${feature}`)
               .moveDown(0.5);
        });

        // Support Section
        doc.addPage();
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('8. Support', { destination: 'support' })
           .moveDown();

        doc.fontSize(12)
           .font('Helvetica')
           .text('For API support, please contact:')
           .moveDown()
           .text('Email: support@safevault.com')
           .text('GitHub Issues: github.com/anmoldeepsingh/SafeVault/issues')
           .moveDown(2);

        // Footer
        doc.fontSize(10)
           .text('© 2024 SafeVault. All rights reserved.', {
               align: 'center'
           });

        console.log('Ending PDF generation...');
        await doc.end();
        await finishPromise;

        console.log('Checking if file exists:', fs.existsSync(filePath));
        console.log('File size:', fs.statSync(filePath).size);

        return {
            success: true,
            filePath
        };
    } catch (error) {
        console.error('Error in generateAPIDocumentation:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    generateUserReport,
    generateAPIDocumentation
}; 