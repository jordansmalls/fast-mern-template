import { LegalPage } from "@/components/legal-page"

export const metadata = { title: "Privacy Policy | Acme" }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <section>
        <h2>Account information</h2>
        <p>
          The service uses your email address, account identifier, and account
          timestamps to provide your account. Passwords are stored as hashes on
          the server.
        </p>
      </section>
      <section>
        <h2>Cookies and preferences</h2>
        <p>
          The service uses cookies to maintain your signed-in session. The
          browser also stores interface preferences, such as your color theme.
        </p>
      </section>
      <section>
        <h2>Managing your information</h2>
        <p>
          You can update your email and password or delete your account in
          Settings. Add your process for data access, exports, and other privacy
          requests here.
        </p>
      </section>
      <section>
        <h2>Retention and service providers</h2>
        <p>
          [Describe your hosting providers, server logs, retention periods,
          backups, analytics, and any data sharing for your product.]
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          [Add your company name, privacy contact email, and effective date.]
        </p>
      </section>
    </LegalPage>
  )
}
