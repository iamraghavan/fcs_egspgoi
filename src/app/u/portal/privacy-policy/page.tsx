
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy - CreditWise',
  description: 'Privacy Policy for the CreditWise application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </header>

        <div className="prose prose-lg mx-auto max-w-none text-foreground prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
            <p>
                Welcome to CreditWise, the faculty performance management system for E.G.S. Pillay Group of Institutions. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>

            <h2 className="mt-8">1. Information We Collect</h2>
            <p>
                We may collect information about you in a variety of ways. The information we may collect via the Application includes:
            </p>
            <ul>
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, faculty ID, college, and department, that you voluntarily give to us when you register with the Application.</li>
                <li><strong>Achievement Data:</strong> Information you provide related to your professional achievements, including titles, descriptions, points, and supporting documentation (proof).</li>
                <li><strong>Usage Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Application.</li>
            </ul>

            <h2 className="mt-8">2. Use of Your Information</h2>
            <p>
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
            </p>
            <ul>
                <li>Create and manage your account.</li>
                <li>Track and manage your credit submissions and performance records.</li>
                <li>Enable administrator review and management of faculty credits.</li>
                <li>Generate internal reports and analytics on faculty performance.</li>
                <li>Notify you of updates to your submissions or remarks from administrators.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            </ul>

            <h2 className="mt-8">3. Disclosure of Your Information</h2>
            <p>
                We do not share your personal information with third parties except as described in this Privacy Policy. We may share information we have collected about you in certain situations:
            </p>
            <ul>
                <li><strong>With Other Users:</strong> Your name, college, and department may be visible to administrators and other authorized personnel within the institution for the purpose of managing the credit system.</li>
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work.</li>
            </ul>

            <h2 className="mt-8">4. Security of Your Information</h2>
            <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2 className="mt-8">5. Policy for Children</h2>
            <p>
                We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
            </p>

            <h2 className="mt-8">6. Changes to This Privacy Policy</h2>
            <p>
                We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2 className="mt-8">7. Contact Us</h2>
            <p>
                If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:admin@egspgroup.in">admin@egspgroup.in</a>.
            </p>
        </div>

        <div className="mt-12 text-center">
            <Button asChild>
                <Link href="/u/portal/dashboard">Back to Dashboard</Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
