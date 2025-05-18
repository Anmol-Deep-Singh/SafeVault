const cron = require('node-cron');
const { detectFraud } = require('../utils/fraudDetection');
const { saveReport } = require('../utils/reportGenerator');

// Log mockup fraud detection report
function logFraudReport(reportPath, fraudReport) {
    const { summary } = fraudReport;
    const hasHighSeverity = summary.bySeverity.HIGH > 0;

    const emailContent = `
=============== MOCKUP EMAIL ===============
From: admin@safevault.com
To: admin@safevault.com
Subject: [${hasHighSeverity ? 'URGENT' : 'DAILY'}] Fraud Detection Report - ${new Date().toLocaleDateString()}
------------------------------------------

Daily Fraud Detection Report
---------------------------
Period: ${new Date(fraudReport.period.start).toLocaleString()} - ${new Date(fraudReport.period.end).toLocaleString()}

Summary:
- Total Alerts: ${summary.totalAlerts}
- High Severity Alerts: ${summary.bySeverity.HIGH}
- Medium Severity Alerts: ${summary.bySeverity.MEDIUM}

Report files generated:
- HTML Report: ${reportPath}

------------------------------------------
=============== END EMAIL ===============
`;

    console.log(emailContent);
}

// Log mockup error report
function logErrorReport(error) {
    const errorEmailContent = `
=============== MOCKUP ERROR EMAIL ===============
From: admin@safevault.com
To: admin@safevault.com
Subject: [ERROR] Fraud Detection Job Failed
------------------------------------------

Fraud Detection Job Error
------------------------
The fraud detection job failed with the following error:

${error.stack}

------------------------------------------
=============== END EMAIL ===============
`;

    console.error(errorEmailContent);
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

        // Log report if there are any alerts
        if (fraudReport.summary.totalAlerts > 0) {
            logFraudReport(htmlReportPath, fraudReport);
        } else {
            console.log('No alerts found, skipping notification');
        }

        console.log('Fraud detection job completed successfully');
    } catch (error) {
        console.error('Fraud detection job failed:', error);
        // Log error report
        logErrorReport(error);
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