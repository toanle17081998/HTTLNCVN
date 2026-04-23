import { PublicContentPage } from "@/modules/page/components/PublicContentPage";

export default function PrivacyRoute() {
  return (
    <PublicContentPage
      fallback={{
        title: "Privacy",
        description: "Public privacy information for HTNC.",
        body: "Privacy content can be managed from the admin CMS.",
      }}
      slug="privacy"
    />
  );
}
