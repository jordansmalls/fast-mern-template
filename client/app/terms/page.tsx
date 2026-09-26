import { LegalPage } from "@/components/legal-page"

export const metadata = { title: "Terms of Service | Acme" }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <section>
        <h2>Using the service</h2>
        <p>
          Use this service lawfully. Do not interfere with its operation or
          attempt to access another person&apos;s account.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          Provide accurate account information and keep your password private.
          You can update your email or password, or delete your account, in
          Settings.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          The service may change or be unavailable at times. Add your
          product&apos;s availability commitments, payment terms, and
          cancellation rules here, if applicable.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          [Add your company name, contact email, effective date, and any
          jurisdiction-specific terms.]
        </p>
      </section>
    </LegalPage>
  )
}
