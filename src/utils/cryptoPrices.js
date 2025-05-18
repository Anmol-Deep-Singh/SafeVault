const axios = require('axios');

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Cache prices for 1 minute to avoid hitting rate limits
let priceCache = {
    timestamp: 0,
    prices: {}
};

const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

async function getRealTimePrices() {
    try {
        // Check if cache is still valid
        const now = Date.now();
        if (now - priceCache.timestamp < CACHE_DURATION) {
            return priceCache.prices;
        }

        // Fetch real-time prices from CoinGecko with additional market data
        const response = await axios.get(`${COINGECKO_API_BASE}/simple/price`, {
            params: {
                ids: 'bitcoin,ethereum,dogecoin',
                vs_currencies: 'inr',
                include_24hr_change: true,
                include_24hr_vol: true,
                include_market_cap: true,
                precision: 'full'
            }
        });

        // Update cache with enhanced data
        priceCache = {
            timestamp: now,
            prices: {
                Bitcoin: {
                    price: response.data.bitcoin.inr,
                    change24h: response.data.bitcoin.inr_24h_change,
                    volume24h: response.data.bitcoin.inr_24h_vol,
                    marketCap: response.data.bitcoin.inr_market_cap
                },
                Ethereum: {
                    price: response.data.ethereum.inr,
                    change24h: response.data.ethereum.inr_24h_change,
                    volume24h: response.data.ethereum.inr_24h_vol,
                    marketCap: response.data.ethereum.inr_market_cap
                },
                Dogecoin: {
                    price: response.data.dogecoin.inr,
                    change24h: response.data.dogecoin.inr_24h_change,
                    volume24h: response.data.dogecoin.inr_24h_vol,
                    marketCap: response.data.dogecoin.inr_market_cap
                }
            }
        };

        return priceCache.prices;
    } catch (error) {
        console.error('Error fetching real-time prices:', error);
        throw new Error('Failed to fetch real-time cryptocurrency prices');
    }
}

// Convert amount between currencies using real-time rates
async function convertWithRealTimeRates(amount, fromCurrency, toCurrency) {
    try {
        const prices = await getRealTimePrices();
        
        // If converting from INR to crypto
        if (fromCurrency === 'INR') {
            return amount / prices[toCurrency].price;
        }
        
        // If converting from crypto to INR
        if (toCurrency === 'INR') {
            return amount * prices[fromCurrency].price;
        }
        
        // If converting between cryptocurrencies
        const inrValue = amount * prices[fromCurrency].price;
        return inrValue / prices[toCurrency].price;
    } catch (error) {
        console.error('Error converting with real-time rates:', error);
        throw new Error('Failed to convert using real-time rates');
    }
}

// Get formatted market data for display
function getFormattedMarketData(cryptoData) {
    return {
        price: cryptoData.price.toLocaleString('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 2 
        }),
        change24h: cryptoData.change24h.toFixed(2) + '%',
        volume24h: cryptoData.volume24h.toLocaleString('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0 
        }),
        marketCap: cryptoData.marketCap.toLocaleString('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0 
        })
    };
}

module.exports = {
    getRealTimePrices,
    convertWithRealTimeRates,
    getFormattedMarketData
}; 