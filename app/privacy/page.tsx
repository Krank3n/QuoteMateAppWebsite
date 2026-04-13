import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'QuoteMate Privacy Policy. Learn how we collect, use, and protect your personal information.',
  alternates: { canonical: 'https://quotemateapp.au/privacy' },
  openGraph: {
    title: 'Privacy Policy — QuoteMate',
    url: 'https://quotemateapp.au/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Header homeLinks />
      <main className="legal-page">
        <div className="container">
          <div className="legal-content">
            <h1>Privacy Policy</h1>
            <p className="legal-date">Effective date: 1 March 2026</p>

            <p>QuoteMate (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the &ldquo;Service&rdquo;). This policy complies with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).</p>

            <p>By using QuoteMate, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access or use the Service.</p>

            <h2>1. Information We Collect</h2>
            <h3>1.1 Personal Information</h3>
            <p>When you create an account or use our Service, we may collect the following personal information:</p>
            <ul>
              <li>Name and email address</li>
              <li>Business name and ABN (Australian Business Number)</li>
              <li>Phone number</li>
              <li>Business logo and branding details</li>
              <li>Payment information (processed securely through third-party payment providers)</li>
              <li>Bank account details, PayID, or BPAY reference numbers you choose to include on invoices</li>
            </ul>

            <h3>1.2 Business Data</h3>
            <p>In the course of using our Service, you may provide or generate:</p>
            <ul>
              <li>Quotes, invoices, and related documents</li>
              <li>Client and customer information you enter</li>
              <li>Job descriptions, materials lists, and pricing information</li>
              <li>Payment records and tracking data</li>
            </ul>

            <h3>1.3 Automatically Collected Information</h3>
            <p>When you use our Service, we may automatically collect:</p>
            <ul>
              <li>Device information (device type, operating system, unique device identifiers)</li>
              <li>Usage data (features used, pages visited, time spent)</li>
              <li>IP address and general location information</li>
              <li>App crash reports and performance data</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide, maintain, and improve our Service</li>
              <li>To process your quotes, invoices, and business documents</li>
              <li>To sync your data across your devices</li>
              <li>To provide AI-powered quoting suggestions and material pricing</li>
              <li>To process subscription payments</li>
              <li>To send you service-related communications (e.g., account verification, billing notifications)</li>
              <li>To provide customer support</li>
              <li>To analyse usage trends and improve user experience</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>QuoteMate uses Google Firebase for data storage and authentication. Firebase provides enterprise-grade security, including:</p>
            <ul>
              <li>Data encryption in transit (TLS/SSL) and at rest (AES-256)</li>
              <li>Secure authentication protocols</li>
              <li>Regular security audits and compliance certifications</li>
              <li>Data stored in secure data centres</li>
            </ul>
            <p>While we implement commercially reasonable security measures, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your data.</p>

            <h2>4. Third-Party Services</h2>
            <p>Our Service may integrate with or use the following third-party services:</p>
            <ul>
              <li><strong>Google Firebase</strong> — for authentication, data storage, cloud sync, and analytics</li>
              <li><strong>Apple App Store / Google Play Store</strong> — for subscription management and payment processing</li>
              <li><strong>Third-party suppliers</strong> — for retrieving current material pricing information (no personal data is shared)</li>
              <li><strong>OpenAI / AI services</strong> — for AI-powered job analysis and material suggestions (job descriptions may be processed; no personally identifiable information is shared)</li>
            </ul>
            <p>These third-party services have their own privacy policies, and we encourage you to review them.</p>

            <h2>5. Cookies and Tracking</h2>
            <p>Our website uses cookies and similar tracking technologies to:</p>
            <ul>
              <li>Remember your preferences and settings</li>
              <li>Analyse website traffic and usage patterns</li>
              <li>Improve our website and services</li>
            </ul>
            <p>You can control cookies through your browser settings. Disabling cookies may affect certain features of our website.</p>

            <h2>6. Data Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>With your consent</strong> — when you explicitly authorise us to share information</li>
              <li><strong>Service providers</strong> — with trusted third-party providers who assist in operating our Service (subject to confidentiality obligations)</li>
              <li><strong>Legal requirements</strong> — when required by law, regulation, legal process, or governmental request</li>
              <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Protection of rights</strong> — to protect the rights, property, or safety of QuoteMate, our users, or the public</li>
            </ul>

            <h2>7. Your Rights</h2>
            <p>Under the Australian Privacy Act, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request access to the personal information we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate or incomplete personal information</li>
              <li><strong>Deletion</strong> — request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Data portability</strong> — request a copy of your data in a structured, commonly used format</li>
              <li><strong>Complaint</strong> — lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you believe your privacy has been breached</li>
            </ul>
            <p>To exercise any of these rights, please contact us at the details provided below.</p>

            <h2>8. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide you with our Service. When you delete your account, we will delete or anonymise your personal information within 30 days, except where retention is required by law.</p>

            <h2>9. Children&rsquo;s Privacy</h2>
            <p>Our Service is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete that information.</p>

            <h2>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &ldquo;Effective date&rdquo; at the top. We encourage you to review this Privacy Policy periodically.</p>

            <h2>11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:hello@quotemateapp.au">hello@quotemateapp.au</a></li>
              <li>Website: <a href="https://quotemateapp.au">quotemateapp.au</a></li>
            </ul>
            <p>If you are not satisfied with our response to a privacy complaint, you may contact the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">www.oaic.gov.au</a>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
