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

module.exports = {
    generateUserReport
}; 