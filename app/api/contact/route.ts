import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((value, key) => {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    });
}, 30 * 60 * 1000);

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return 'unknown';
}

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

// ─── Validation ─────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeHeaderValue(value: string): string {
    return value.replace(/[\r\n]/g, '');
}

// ─── Handler ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const { name, email, message, website } = body;

    // Honeypot check — bots fill this hidden field; silently accept to fool them
    if (typeof website === 'string' && website.trim() !== '') {
        return NextResponse.json({ message: 'Message sent successfully!' });
    }

    // Type checking for required fields
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
        return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    // Length limits
    if (!name.trim() || name.length > 100) {
        return NextResponse.json({ error: 'Name is required and must be under 100 characters.' }, { status: 400 });
    }
    if (!email.trim() || email.length > 254) {
        return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    if (!message.trim() || message.length > 5000) {
        return NextResponse.json({ error: 'Message is required and must be under 5000 characters.' }, { status: 400 });
    }

    // Email format validation
    if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    // Sanitize header-injection vectors
    const safeName = sanitizeHeaderValue(name.trim());
    const safeEmail = sanitizeHeaderValue(email.trim());
    const safeMessage = message.trim();

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
        secure: parseInt(process.env.EMAIL_SERVER_PORT || '465') === 465,
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"${safeName}" <${process.env.EMAIL_FROM}>`,
        replyTo: safeEmail,
        to: process.env.EMAIL_FROM,
        subject: `QuoteMate enquiry from ${safeName}`,
        text: `You have a new message from your website contact form:\n\nName: ${safeName}\nEmail: ${safeEmail}\n\nMessage: ${safeMessage}`,
        html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #333;">New Contact Form Submission</h2>
      <p>You have received a new message from the QuoteMate website contact form.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p><strong>Message:</strong></p>
      <div style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <p style="white-space: pre-wrap;">${safeMessage.replace(/\n/g, '<br>')}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 0.9em; color: #777;">This email was sent from the QuoteMate website contact form.</p>
    </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return NextResponse.json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
    }
}
