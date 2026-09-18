const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const { senderEmail, appPassword, targetEmail, subject, message } = req.body;

    if (!senderEmail || !appPassword || !targetEmail || !subject || !message) {
        return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: senderEmail, pass: appPassword }
        });

        const info = await transporter.sendMail({
            from: senderEmail,
            to: targetEmail,
            subject,
            text: message,
            html: `<div style="font-family:Arial,sans-serif;padding:20px;">${message.replace(/\n/g, '<br>')}</div>`
        });

        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};