const cron = require('node-cron');
const { detectFraud } = require('../utils/fraudDetection');
const { saveReport } = require('../utils/reportGenerator');
const Email = require('../models/email');

// Save fraud report email
async function saveFraudReport(reportPath, fraudReport) {
    const { summary } = fraudReport;
    const hasHighSeverity = summary.bySeverity.HIGH > 0;

    const emailContent = `
<div class="email-content">
    <h2>Daily Fraud Detection Report</h2>
    <p><strong>Period:</strong> ${new Date(fraudReport.period.start).toLocaleString()} - ${new Date(fraudReport.period.end).toLocaleString()}</p>
    
    <div class="summary-section">
        <h3>Summary</h3>
        <ul>
            <li>Total Alerts: ${summary.totalAlerts}</li>
            <li>High Severity Alerts: ${summary.bySeverity.HIGH}</li>
            <li>Medium Severity Alerts: ${summary.bySeverity.MEDIUM}</li>
        </ul>
    </div>

    <div class="alerts-section">
        <h3>Alerts Breakdown</h3>
        <ul>
            <li>Large Transactions: ${summary.byType.largeTransactions}</li>
            <li>Frequent Transactions: ${summary.byType.frequentTransactions}</li>
            <li>Rapid Transactions: ${summary.byType.rapidTransactions}</li>
        </ul>
    </div>

    <div class="report-links">
        <p><strong>Report files generated:</strong></p>
        <ul>
            <li>HTML Report: ${reportPath}</li>
        </ul>
    </div>
</div>`;

    const email = new Email({
        subject: `[${hasHighSeverity ? 'URGENT' : 'DAILY'}] Fraud Detection Report - ${new Date().toLocaleDateString()}`,
        content: emailContent,
        type: 'FRAUD_ALERT',
        severity: hasHighSeverity ? 'HIGH' : 'MEDIUM'
    });

    await email.save();
}

// Save error report email
async function saveErrorReport(error) {
    const errorEmailContent = `
<div class="email-content error">
    <h2>Fraud Detection Job Error</h2>
    <p>The fraud detection job failed with the following error:</p>
    <pre class="error-stack">${error.stack}</pre>
</div>`;

    const email = new Email({
        subject: '[ERROR] Fraud Detection Job Failed',
        content: errorEmailContent,
        type: 'ERROR',
        severity: 'HIGH'
    });

    await email.save();
}

// Run fraud detection and generate report
async function runFraudDetection() {
    try {
        console.log('Starting fraud detection scan...');
        
        // Set time period for the scan (last 24 hours)
        const endDate = new Date();
        const startDate = new Date(endDate - 24 * 60 * 60 * 1000);

        // Run fraud detection
        const fraudReport = await detectFraud(startDate, endDate);
        console.log(`Fraud detection completed. Found ${fraudReport.summary.totalAlerts} alerts.`);

        // Save reports in both formats
        const [htmlReportPath, jsonReportPath] = await Promise.all([
            saveReport(fraudReport, 'html'),
            saveReport(fraudReport, 'json')
        ]);

        console.log('Reports generated:', {
            html: htmlReportPath,
            json: jsonReportPath
        });

        // Save email notification if there are any alerts
        if (fraudReport.summary.totalAlerts > 0) {
            await saveFraudReport(htmlReportPath, fraudReport);
            console.log('Fraud detection email notification saved');
        } else {
            console.log('No alerts found, skipping notification');
        }

        console.log('Fraud detection job completed successfully');
    } catch (error) {
        console.error('Fraud detection job failed:', error);
        // Save error report email
        await saveErrorReport(error);
    }
}

// Schedule the job to run daily at 1 AM IST
const scheduleFraudDetection = () => {
    cron.schedule('0 1 * * *', runFraudDetection, {
        timezone: 'Asia/Kolkata'
    });
    console.log('Fraud detection job scheduled to run daily at 1 AM IST');
};

module.exports = {
    scheduleFraudDetection,
    runFraudDetection // Exported for manual running and testing
}; 