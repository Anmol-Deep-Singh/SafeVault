const { getRealTimePrices, convertWithRealTimeRates } = require('./cryptoPrices');

async function getConversionRates() {
    try {
        const realTimePrices = await getRealTimePrices();
        
        
        const rates = {
            INR: {
                INR: 1,
                Bitcoin: 1 / realTimePrices.Bitcoin,
                Ethereum: 1 / realTimePrices.Ethereum,
                Dogecoin: 1 / realTimePrices.Dogecoin
            },
            Bitcoin: {
                INR: realTimePrices.Bitcoin,
                Bitcoin: 1,
                Ethereum: realTimePrices.Bitcoin / realTimePrices.Ethereum,
                Dogecoin: realTimePrices.Bitcoin / realTimePrices.Dogecoin
            },
            Ethereum: {
                INR: realTimePrices.Ethereum,
                Bitcoin: realTimePrices.Ethereum / realTimePrices.Bitcoin,
                Ethereum: 1,
                Dogecoin: realTimePrices.Ethereum / realTimePrices.Dogecoin
            },
            Dogecoin: {
                INR: realTimePrices.Dogecoin,
                Bitcoin: realTimePrices.Dogecoin / realTimePrices.Bitcoin,
                Ethereum: realTimePrices.Dogecoin / realTimePrices.Ethereum,
                Dogecoin: 1
            }
        };

        return rates;
    } catch (error) {
        console.error('Error getting conversion rates:', error);
        throw new Error('Failed to get conversion rates');
    }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
    try {
        return await convertWithRealTimeRates(amount, fromCurrency, toCurrency);
    } catch (error) {
        console.error('Error converting currency:', error);
        throw new Error('Currency conversion failed');
    }
}

// Calculate total portfolio value in INR using real-time prices
async function calculatePortfolioValueINR(balances) {
    try {
        const realTimePrices = await getRealTimePrices();
        
        const totalINR = balances.INR +
            (balances.Bitcoin || 0) * realTimePrices.Bitcoin +
            (balances.Ethereum || 0) * realTimePrices.Ethereum +
            (balances.Dogecoin || 0) * realTimePrices.Dogecoin;

        // Calculate individual values for breakdown
        const breakdown = {
            INR: balances.INR || 0,
            Bitcoin: (balances.Bitcoin || 0) * realTimePrices.Bitcoin,
            Ethereum: (balances.Ethereum || 0) * realTimePrices.Ethereum,
            Dogecoin: (balances.Dogecoin || 0) * realTimePrices.Dogecoin
        };

        return {
            totalValueINR: totalINR,
            breakdown: breakdown,
            percentages: {
                INR: ((breakdown.INR / totalINR) * 100).toFixed(2),
                Bitcoin: ((breakdown.Bitcoin / totalINR) * 100).toFixed(2),
                Ethereum: ((breakdown.Ethereum / totalINR) * 100).toFixed(2),
                Dogecoin: ((breakdown.Dogecoin / totalINR) * 100).toFixed(2)
            }
        };
    } catch (error) {
        console.error('Error calculating portfolio value:', error);
        throw new Error('Failed to calculate portfolio value');
    }
}

module.exports = {
    getConversionRates,
    convertCurrency,
    calculatePortfolioValueINR
}; 