import Link from "next/link";
import { Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Terms of Use</h1>
            <p className="text-sm text-text-muted">Last updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Orbiting ("the Platform"), you agree to be bound by these Terms of Use. If you do not agree, you may not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Platform. By creating an account, you represent that you meet this requirement and that all information you provide is accurate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">3. Account Responsibility</h2>
            <p>
              You are solely responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">4. User Conduct</h2>
            <p>
              You agree not to use the Platform to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Harass, abuse, or harm others</li>
              <li>Post spam, malware, or illegal content</li>
              <li>Impersonate any person or entity</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the operation of the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">5. Content Ownership</h2>
            <p>
              You retain ownership of content you post. By posting, you grant Orbiting a non-exclusive, royalty-free license to display, distribute, and moderate your content on the Platform. We reserve the right to remove content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">6. Privacy</h2>
            <p>
              Your use of the Platform is governed by our{" "}
              <Link href="/privacy" className="text-brand-400 hover:text-brand-300 underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">7. Limitation of Liability</h2>
            <p>
              Orbiting is provided "as is" without warranties of any kind. We are not liable for damages arising from your use of the Platform, including but not limited to loss of data, interruption of service, or user disputes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, at our sole discretion and without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">9. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use after changes constitutes acceptance. We will notify you of material changes via email or in-app notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">10. Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@orbiting.app" className="text-brand-400 hover:text-brand-300 underline">support@orbiting.app</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle flex gap-4">
          <Link href="/signup" className="text-sm text-brand-400 hover:text-brand-300 underline">Back to Sign Up</Link>
          <Link href="/privacy" className="text-sm text-brand-400 hover:text-brand-300 underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
