const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config(); // Load environment variables

// Replace these with your actual credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 * Send an email using Gmail API with OAuth2
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {string} html - Email body (HTML)
 */
async function sendMail(to, subject, text, html) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: `OWS <${EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };

        const result = await transport.sendMail(mailOptions);
        console.log("✅ Email sent successfully:");
        return { success: true, message: "Email sent successfully", result };
    } catch (error) {
        console.log("❌ Error sending email:");
        return { success: false, message: "Failed to send email", error };
    }
}

module.exports = { sendMail };