import { PublicContentPage } from "@/modules/page/components/PublicContentPage";

export default function TermsRoute() {
  return (
    <PublicContentPage
      fallback={{
        title: "Terms",
        description: "Public terms for using the HTNC platform.",
        body: "Terms content can be managed from the admin CMS.",
      }}
      slug="terms"
    />
  );
}
