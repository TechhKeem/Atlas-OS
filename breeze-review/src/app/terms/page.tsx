import { DISCLAIMER, site } from "@/config/site";
import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Terms of Use | Breeze Review" };

export default function Terms() {
  const co = site.parentBrand;
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms govern your use of {site.productName}, provided by {co} ("{co}", "we", "us"), [legal entity name]. By using the
        service you agree to them and to our Privacy Policy. If you do not agree, please do not use it.
      </p>

      <h2>Education only, not advice</h2>
      <p>{DISCLAIMER}</p>
      <ul>
        <li>Results, findings and coverage ranges are general educational estimates based on what you tell us and what we read from your documents. They are <strong>not</strong> a quote, an offer or solicitation of insurance, a recommendation of any product, carrier or price, or legal, tax or financial advice.</li>
        <li>Using {site.productName} does not create an agent-client or advisory relationship. A licensed agent is required to finalize any recommendation, and licensing varies by state.</li>
        <li>Rules of thumb (such as income multiples) are starting points, not a calculation of what you need.</li>
      </ul>

      <h2>AI-generated content</h2>
      <p>
        We use artificial intelligence to read documents and answer questions. It can misread a document or make errors, especially with
        blurry scans or unusual policy forms. Always confirm important details against your actual policy and with your carrier or a
        licensed agent before making decisions. Do not rely on the assistant for emergencies.
      </p>

      <h2>Eligibility</h2>
      <p>You must be at least 18, a resident of a state we serve, and provide accurate information.</p>

      <h2>Your content</h2>
      <ul>
        <li>You may upload only documents you are entitled to share. Do not upload anyone's Social Security number or financial account numbers.</li>
        <li>You give {co} and its service providers permission to process what you submit to provide the service, as described in the Privacy Policy. You keep ownership of your documents.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>No unlawful, fraudulent or abusive use; no attempts to break, probe or overload the service or bypass its limits.</li>
        <li>No automated scraping, and no use of the service to build a competing product.</li>
        <li>We may rate-limit, suspend or block use that looks abusive.</li>
      </ul>

      <h2>Communications and consent</h2>
      <p>
        If you check the consent box, you agree that {co} may contact you by phone, text message and email about your results, including
        using automated dialing technology and prerecorded or artificial voice messages, at the number and email you provided. Consent is
        not a condition of purchase. Message frequency varies; message and data rates may apply. Reply STOP to opt out of texts and HELP
        for help. You may revoke consent at any time. [Counsel to confirm wording against current TCPA, FCC and carrier (CTIA) requirements and
        state telemarketing rules.]
      </p>

      <h2>Third-party services</h2>
      <p>Booking uses Calendly and is subject to its terms. We are not responsible for third-party sites or services.</p>

      <h2>Disclaimers and limits of liability</h2>
      <p>
        The service is provided "as is" and "as available," without warranties of any kind to the fullest extent allowed by law. To the
        fullest extent allowed by law, {co} is not liable for indirect, incidental, special or consequential damages, or for decisions you
        make based on the educational content, and our total liability for any claim is limited to [amount, e.g. $100]. Some states do not
        allow certain limits, so they may not apply to you. [Counsel to review.]
      </p>

      <h2>General</h2>
      <p>
        These terms are governed by the laws of [state], and disputes will be resolved in [venue/arbitration clause, if any]. We may update
        these terms by posting a new date; continued use means you accept the changes. Contact: {site.contactEmail}, [mailing address].
      </p>
    </LegalPage>
  );
}
