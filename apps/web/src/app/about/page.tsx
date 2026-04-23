import { PublicContentPage } from "@/modules/page/components/PublicContentPage";

export default function AboutRoute() {
  return (
    <PublicContentPage
      fallback={{
        title: "About Us",
        description: "Public information about HTNC, our learning focus, and the community this platform supports.",
        body:
          "HTNC Platform brings public updates, learning paths, events, and member tools into one calm workspace. Guests can learn who we are; members and admins unlock deeper community workflows after login.",
      }}
      slug="about"
    />
  );
}
