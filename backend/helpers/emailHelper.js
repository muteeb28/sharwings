import nodemailer from "nodemailer";

const parseBool = (value) =>
	value === true || value === "true" || value === "1";

class EmailHelper {
    constructor(config = {}) {
        const {
            host = process.env.NODEMAILER_HOST,
            port = process.env.NODEMAILER_PORT,
            secure,
            user = process.env.NODEMAILER_EMAIL,
            pass = process.env.NODEMAILER_PASS,
            disabled = parseBool(process.env.NODEMAILER_DISABLED),
        } = config;

        const portNumber = Number(port);
        const secureDefault =
            secure !== undefined
                ? secure
                : process.env.NODEMAILER_SECURE !== undefined
                    ? parseBool(process.env.NODEMAILER_SECURE)
                    : portNumber === 465;

        this.disabled = disabled || !host || !user || !pass;

        if (this.disabled) {
            this.transporter = null;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port: portNumber,
            secure: secureDefault,
            auth: { user, pass },
        });
    }

    logger () {
        console.log(this.transporter);
    }

    static renderTemplate (template, variables) {
        return template.replace(/\{\{(.*?)\}\}/g, (_, key) => variables[key.trim()] || '');
    }

    async sendEmail ({to, subject, text, html}) {
        if (this.disabled) {
            console.log("Email disabled or not configured. Skipping send.");
            return { skipped: true };
        }

        const mailOptions = {
            from: `"Sharwings" <${process.env.NODEMAILER_EMAIL}>`,
            to,
            subject,
            text,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Email sent: ", info.messageId);
            return info;
        } catch (error) {
            console.error("Error sending email: ", error);
            throw error;
        }
    }
}

export default EmailHelper;
