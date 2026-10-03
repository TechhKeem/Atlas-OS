import { site } from "@/config/site";
import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy | Breeze Review" };

export default function Privacy() {
  const co = site.parentBrand;
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {site.productName} is provided by {co} ("{co}", "we", "us"), [legal entity name and mailing address]. This policy explains what
        we collect when you use {site.productName}, how we use and protect it, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Contact details</strong> you enter: name, email, mobile phone number and state.</li>
        <li><strong>Your answers</strong>: income, debts, mortgage, family details, existing coverage and preferences.</li>
        <li><strong>Documents you upload</strong>, such as a life insurance policy, and the details we read from them (carrier, coverage amount, dates, premiums, riders, cash value, and names printed on the policy).</li>
        <li><strong>Your chat messages</strong> with the {site.productName} assistant and the results generated for you.</li>
        <li><strong>Consent records</strong>: when you agree to be contacted we record the exact wording shown, the time, your IP address and your browser type.</li>
        <li><strong>Usage and source data</strong>: which steps you complete, and marketing parameters such as the ad or link you came from (for example UTM tags).</li>
      </ul>
      <p>We do not ask for Social Security numbers or financial account numbers. Please do not upload them. If a policy document contains them, we do not need them.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To read your policy, calculate your results, and answer your questions.</li>
        <li>If you gave consent, so a licensed {co} agent can contact you by phone, text or email about your results and help you book a call.</li>
        <li>To score and prioritize inquiries so we can respond to people who want help.</li>
        <li>To run, secure and improve the service, prevent abuse, and meet legal obligations.</li>
      </ul>
      <p>We do not sell your personal information, and we do not share it for cross-context behavioral advertising. [Compliance to confirm.]</p>

      <h2>AI processing</h2>
      <p>
        To read your document and power the chat, we send your document or chat messages and relevant results to Anthropic, an AI provider,
        through its API. We send only what is needed for that task. [Confirm Anthropic's current API data-retention and training terms
        with counsel and describe them here.] AI output can contain mistakes; see our Terms of Use.
      </p>

      <h2>Who else handles your data</h2>
      <p>We use service providers to operate {site.productName}, under contract and only for our purposes:</p>
      <ul>
        <li>Supabase (database and private file storage)</li>
        <li>Netlify (website hosting)</li>
        <li>Anthropic (AI processing, described above)</li>
        <li>Calendly (scheduling a call with an agent)</li>
        <li>Google Workspace (an internal spreadsheet summary for our team: name, contact details, state, results headline, lead score and source; never your document)</li>
      </ul>
      <p>We may also disclose information if required by law or to protect rights and safety, or in connection with a sale or reorganization of our business.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li><strong>Uploaded documents</strong> are automatically deleted from storage 30 days after upload.</li>
        <li><strong>Results, answers, contact details, consent records and chat transcripts</strong> are kept [retention period set by {co}, for example __ months/years], or until you ask us to delete them, unless the law requires us to keep them longer.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit and at rest. Documents are stored in a private location that is not publicly accessible, and are
        available only to authorized staff through short-lived access links. No system is perfectly secure, so we cannot guarantee absolute security.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li><strong>Stop contact:</strong> reply STOP to any text, use the unsubscribe link in any email, or tell an agent on a call. Consent is not a condition of purchase.</li>
        <li><strong>Access, correction and deletion:</strong> email {site.contactEmail} and we will verify your identity and respond within the time required by law. We will delete your documents and personal data on request, subject to legal exceptions.</li>
        <li><strong>State privacy rights:</strong> depending on where you live (for example California, Colorado, Connecticut, Virginia and others), you may have rights to know, access, correct, delete, and opt out of sale or sharing. We will not discriminate against you for exercising them. [Counsel to add state-specific disclosures and the categories-of-information table required by CCPA/CPRA.]</li>
      </ul>

      <h2>Cookies and analytics</h2>
      <p>We use first-party analytics to understand which steps people complete, and your browser's local storage to save your progress so a refresh does not lose it. [List any advertising pixels or third-party analytics tags added at launch, and any consent banner required.]</p>

      <h2>Children</h2>
      <p>{site.productName} is for adults 18 and older. We do not knowingly collect information from children.</p>

      <h2>Changes and contact</h2>
      <p>We may update this policy and will post the new date above. Questions or requests: {site.contactEmail}, [mailing address].</p>
    </LegalPage>
  );
}
