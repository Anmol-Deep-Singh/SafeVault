const fs = require('fs').promises;
const path = require('path');

function generateHTMLReport(fraudReport) {
    const { timestamp, period, alerts, summary } = fraudReport;

    const alertsHTML = alerts.map(alert => `
        <div class="alert ${alert.severity.toLowerCase()}">
            <h3>${alert.type}</h3>
            <p><strong>Severity:</strong> ${alert.severity}</p>
            <p>${alert.description}</p>
            ${alert.user ? `
                <div class="user-info">
                    <p><strong>User:</strong> ${alert.user.fullName}</p>
                    <p><strong>Email:</strong> ${alert.user.email}</p>
                </div>
            ` : ''}
            ${alert.transaction ? `
                <div class="transaction-info">
                    <p><strong>Transaction ID:</strong> ${alert.transaction.transactionId}</p>
                    <p><strong>Amount:</strong> ${alert.transaction.amount} ${alert.transaction.currencyType}</p>
                    <p><strong>Time:</strong> ${new Date(alert.transaction.timestamp).toLocaleString()}</p>
                </div>
            ` : ''}
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fraud Detection Report - ${new Date(timestamp).toLocaleDateString()}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                h1, h2 {
                    color: #333;
                }
                .summary {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
                .alert {
                    padding: 15px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                .high {
                    background-color: #ffebee;
                    border-left: 5px solid #ef5350;
                }
                .medium {
                    background-color: #fff3e0;
                    border-left: 5px solid #ffa726;
                }
                .user-info, .transaction-info {
                    margin-left: 15px;
                    padding: 10px;
                    background-color: rgba(255,255,255,0.5);
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Fraud Detection Report</h1>
                <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
                <p><strong>Period:</strong> ${new Date(period.start).toLocaleString()} - ${new Date(period.end).toLocaleString()}</p>
                
                <div class="summary">
                    <h2>Summary</h2>
                    <p><strong>Total Alerts:</strong> ${summary.totalAlerts}</p>
                    <h3>By Type:</h3>
                    <ul>
                        <li>Large Transactions: ${summary.byType.largeTransactions}</li>
                        <li>Frequent Transactions: ${summary.byType.frequentTransactions}</li>
                        <li>Rapid Transactions: ${summary.byType.rapidTransactions}</li>
                    </ul>
                    <h3>By Severity:</h3>
                    <ul>
                        <li>High: ${summary.bySeverity.HIGH}</li>
                        <li>Medium: ${summary.bySeverity.MEDIUM}</li>
                    </ul>
                </div>

                <h2>Alerts</h2>
                ${alertsHTML}
            </div>
        </body>
        </html>
    `;
}

async function saveReport(report, type = 'html') {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportsDir = path.join(process.cwd(), 'reports');
    
    // Create reports directory if it doesn't exist
    await fs.mkdir(reportsDir, { recursive: true });

    if (type === 'html') {
        const htmlContent = generateHTMLReport(report);
        const filePath = path.join(reportsDir, `fraud_report_${timestamp}.html`);
        await fs.writeFile(filePath, htmlContent);
        return filePath;
    } else if (type === 'json') {
        const filePath = path.join(reportsDir, `fraud_report_${timestamp}.json`);
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        return filePath;
    }
}

module.exports = {
    generateHTMLReport,
    saveReport
}; 