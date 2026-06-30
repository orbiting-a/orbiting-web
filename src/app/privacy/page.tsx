import Link from "next/link";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-text-muted">Last updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide when creating an account and using the Platform, including:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Account details: username, email address, display name</li>
              <li>Profile information: bio, avatar, location, interests</li>
              <li>Content: posts, comments, messages, media uploads</li>
              <li>Activity data: likes, follows, orbit memberships, event RSVPs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">2. How We Use Your Information</h2>
            <p>
              We use your information to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, maintain, and improve the Platform</li>
              <li>Personalize your experience and suggest relevant content</li>
              <li>Facilitate communication between users</li>
              <li>Enforce our Terms of Use and community guidelines</li>
              <li>Send service-related notifications and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Service providers (hosting, storage, analytics) who are bound by data agreements</li>
              <li>Law enforcement when required by law</li>
              <li>Other users as part of normal Platform functionality (e.g., your profile is visible to others)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption in transit and at rest. We implement appropriate technical and organizational measures to protect your information. However, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, your data is permanently removed within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">6. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access, correct, or delete your personal data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@orbiting.app" className="text-brand-400 hover:text-brand-300 underline">privacy@orbiting.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and security. Analytics cookies are used to improve the Platform. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">8. Third-Party Services</h2>
            <p>
              The Platform uses the following third-party services:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Supabase — authentication, database, storage, real-time</li>
              <li>Cloudflare R2 — optional media storage</li>
              <li>Infura / WalletConnect — Web3 wallet connections</li>
            </ul>
            <p className="mt-2">
              Each service operates under its own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">9. Children&apos;s Privacy</h2>
            <p>
              The Platform is not intended for children under 13. We do not knowingly collect data from children. If we become aware of such data, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated via email or in-app notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">11. Contact</h2>
            <p>
              For privacy-related inquiries:{" "}
              <a href="mailto:privacy@orbiting.app" className="text-brand-400 hover:text-brand-300 underline">privacy@orbiting.app</a>
            </p>
            <p className="mt-1">
              General support:{" "}
              <a href="mailto:support@orbiting.app" className="text-brand-400 hover:text-brand-300 underline">support@orbiting.app</a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle flex gap-4">
          <Link href="/signup" className="text-sm text-brand-400 hover:text-brand-300 underline">Back to Sign Up</Link>
          <Link href="/terms" className="text-sm text-brand-400 hover:text-brand-300 underline">Terms of Use</Link>
        </div>
      </div>
    </div>
  );
}
