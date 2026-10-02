import { site } from "@/config/site";

export const metadata = { title: "Privacy Policy | Breeze Review" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <p className="rounded-2xl bg-soft p-4 text-sm font-semibold text-breeze-navy-text">
        PLACEHOLDER: this page must be reviewed and replaced by {site.parentBrand} compliance/legal counsel before public launch.
      </p>
      <h1 className="text-4xl">Privacy Policy</h1>
      <p>{site.productName} is an educational tool. It is not a quote, an offer of insurance, or personalized insurance, legal or tax advice. A licensed agent is required to finalize any recommendation.</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Information you provide (contact details, policy documents, answers and chat messages) is used to generate your results and so that {site.parentBrand} can contact you if you consent.</li>
        <li>Uploaded policy documents are stored privately and automatically deleted after 30 days. Structured results are retained per agency policy.</li>
        <li>Documents are shared only with our AI provider to read them for you, and are never sold.</li>
        <li>To request access or deletion, contact {site.contactEmail}.</li>
        <li>[Insert TCPA, state insurance advertising, and privacy-law (e.g. CCPA) language here.]</li>
      </ul>
    </article>
  );
}
