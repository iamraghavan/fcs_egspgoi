
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service - CreditWise',
  description: 'Terms of Service for the CreditWise application.',
};

export default function TermsPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                Terms of Service
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </header>

        <div className="prose prose-lg mx-auto max-w-none text-foreground prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
            <h2 className="mt-8">1. Agreement to Terms</h2>
            <p>
                By accessing and using the CreditWise application ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all users, including faculty, administrators, and office assistants.
            </p>

            <h2 className="mt-8">2. The Service</h2>
            <p>
                CreditWise is a faculty performance management system provided by E.G.S. Pillay Group of Institutions ("the Institution"). The Service allows faculty members to submit achievements for credits and allows administrators to review submissions, issue remarks, and manage the credit system.
            </p>

            <h2 className="mt-8">3. User Accounts</h2>
            <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>

            <h2 className="mt-8">4. User Conduct</h2>
            <p>
                You agree not to use the Service to:
            </p>
            <ul>
                <li>Upload, post, email, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
                <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
                <li>Upload any material that contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware or telecommunications equipment.</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            </ul>

            <h2 className="mt-8">5. Content Ownership and Responsibility</h2>
            <p>
                You retain all rights to the content you submit, post, or display on or through the Service ("Content"). By submitting Content, you grant the Institution a non-exclusive, royalty-free license to use, reproduce, modify, and display such Content solely for the purpose of operating and improving the Service. You are solely responsible for the Content that you post, including its legality, reliability, and appropriateness.
            </p>

            <h2 className="mt-8">6. Termination</h2>
            <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="mt-8">7. Limitation of Liability</h2>
            <p>
                In no event shall the Institution, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>

             <h2 className="mt-8">8. Governing Law</h2>
            <p>
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>

            <h2 className="mt-8">9. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>

            <h2 className="mt-8">10. Contact Us</h2>
            <p>
                If you have any questions about these Terms, please contact us at: <a href="mailto:admin@egspgroup.in">admin@egspgroup.in</a>.
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
