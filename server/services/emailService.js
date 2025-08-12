// Email Service for Capital Fire and Security Sign-In App
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }
    
    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            
            console.log('Email transporter initialized');
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
        }
    }
    
    formatSignInEmail(signInData) {
        const { employeeId, employeeName, location, timestamp } = signInData;
        const formattedTime = new Date(timestamp).toLocaleString('en-CA', {
            timeZone: 'America/Toronto',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const googleMapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .info-box { background: #f8fafc; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    .location-link { background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                    .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Capital Fire & Security</h1>
                    <h2>Employee Sign-In Notification</h2>
                </div>
                
                <div class="content">
                    <h3>Employee Sign-In Details</h3>
                    
                    <div class="info-box">
                        <p><strong>Employee:</strong> ${employeeName || employeeId}</p>
                        <p><strong>Employee ID:</strong> ${employeeId}</p>
                        <p><strong>Sign-In Time:</strong> ${formattedTime} (Eastern Time)</p>
                    </div>
                    
                    <div class="info-box">
                        <h4>Location Information</h4>
                        <p><strong>Coordinates:</strong> ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</p>
                        <p><strong>Accuracy:</strong> ${location.accuracy ? `±${Math.round(location.accuracy)} meters` : 'Unknown'}</p>
                        <a href="${googleMapsUrl}" class="location-link" target="_blank">View Location on Google Maps</a>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This is an automated message from the Capital Fire & Security Employee Sign-In System.</p>
                    <p>Generated on ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })} Eastern Time</p>
                </div>
            </body>
            </html>
        `;
        
        const textContent = `
Capital Fire & Security - Employee Sign-In Notification

Employee Sign-In Details:
- Employee: ${employeeName || employeeId}
- Employee ID: ${employeeId}
- Sign-In Time: ${formattedTime} (Eastern Time)

Location Information:
- Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
- Accuracy: ${location.accuracy ? `±${Math.round(location.accuracy)} meters` : 'Unknown'}
- View Location: ${googleMapsUrl}

This is an automated message from the Capital Fire & Security Employee Sign-In System.
Generated on ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })} Eastern Time
        `;
        
        return {
            subject: `Employee Sign-In: ${employeeName || employeeId} - ${formattedTime}`,
            html: htmlContent,
            text: textContent
        };
    }
    
    async sendSignInNotification(signInData) {
        if (!this.transporter) {
            throw new Error('Email transporter not initialized');
        }
        
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('Email credentials not configured');
        }
        
        const headOfficeEmail = process.env.HEAD_OFFICE_EMAIL || 'office@capitalfireandsecurity.ca';
        const emailContent = this.formatSignInEmail(signInData);
        
        const mailOptions = {
            from: `"Capital Fire & Security Sign-In System" <${process.env.SMTP_USER}>`,
            to: headOfficeEmail,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        };
        
        try {
            console.log(`Sending sign-in email to ${headOfficeEmail}...`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return {
                success: true,
                messageId: result.messageId,
                sentTo: headOfficeEmail
            };
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(`Email sending failed: ${error.message}`);
        }
    }
    
    async testEmailConfiguration() {
        if (!this.transporter) {
            throw new Error('Email transporter not initialized');
        }
        
        try {
            await this.transporter.verify();
            return { success: true, message: 'Email configuration is valid' };
        } catch (error) {
            console.error('Email configuration test failed:', error);
            throw new Error(`Email configuration invalid: ${error.message}`);
        }
    }
}

module.exports = new EmailService();