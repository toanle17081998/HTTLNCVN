import { PublicContentPage } from "@/modules/page/components/PublicContentPage";

export default function ContactRoute() {
  return (
    <PublicContentPage
      fallback={{
        title: "Contact",
        description: "Public contact information for HTNC.",
        body: "Contact details can be managed from the admin CMS.",
      }}
      slug="contact"
    />
  );
}
