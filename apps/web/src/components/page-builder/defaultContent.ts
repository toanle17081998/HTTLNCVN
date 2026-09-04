import { defaultHeroSliderImages } from "./blocks/hero/HeroImageSliderBlock";

export function slugifyPageTitle(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "new-page";
}

export type PageLayoutTemplateId = "simple" | "welcome" | "about" | "ministries" | "events" | "contact";

export const pageLayoutTemplates: Array<{
  description: string;
  id: PageLayoutTemplateId;
  name: string;
}> = [
  { id: "welcome", name: "Welcome landing", description: "Hero Slider, zig-zag features, event carousel, marquee, and testimonials." },
  { id: "about", name: "About our church", description: "Mission, story, core values orbit, gallery loop, and community testimonials." },
  { id: "ministries", name: "Ministries", description: "Interactive tabbed ministries, service card grid, and connecting groups." },
  { id: "events", name: "Events", description: "Live event carousel feed, gathering highlights, and latest announcements." },
  { id: "contact", name: "Visit and contact", description: "Worship times, pastoral care info, testimonials, and visitor guidelines." },
  { id: "simple", name: "Simple page", description: "A clean title, introduction, and minimal feature block." },
];

type TemplateBlock = {
  children?: TemplateBlock[];
  props?: Record<string, unknown>;
  type: string;
};

const text = (value: string, tag: "h1" | "h2" | "h3" | "p" = "p", props: Record<string, unknown> = {}): TemplateBlock => ({
  props: {
    color: tag === "p" ? "var(--text-secondary)" : "var(--text-primary)",
    lineHeight: tag === "p" ? "var(--section-body-leading)" : "var(--section-heading-leading)",
    size: tag === "h1" ? "var(--section-title-size)" : tag === "h2" ? "var(--section-heading-size)" : tag === "h3" ? "var(--section-card-title-size)" : "var(--section-body-size)",
    tag,
    text: value,
    weight: tag === "p" ? "400" : "var(--section-weight-bold)",
    ...props,
  },
  type: "TextBlock",
});

const stack = (children: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children,
  props: { alignItems: "stretch", direction: "column", gap: "var(--section-space-sm)", ...props },
  type: "VerticalStackBlock",
});

const row = (children: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children,
  props: { alignItems: "center", gap: "var(--section-space-xs)", justifyContent: "flex-start", wrap: "wrap", ...props },
  type: "RowBlock",
});

const section = (children: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children,
  props: {
    background: "var(--section-row-background, var(--section-bg-primary))",
    borderColor: "transparent",
    borderRadius: "0",
    borderWidth: "0",
    columns: 1,
    gap: "var(--section-space-lg)",
    marginBottom: "0",
    marginLeft: "0",
    marginRight: "0",
    marginTop: "0",
    padding: "var(--section-space-xl) var(--section-gutter)",
    width: "100%",
    ...props,
  },
  type: "SectionBlock",
});

const button = (label: string, href: string, props: Record<string, unknown> = {}): TemplateBlock => ({
  props: { align: "left", href, label, ...props },
  type: "ButtonBlock",
});

const image = (url: string, alt: string, props: Record<string, unknown> = {}): TemplateBlock => ({
  props: { alt, borderRadius: "var(--section-radius-card)", fit: "cover", height: "var(--section-media-height)", kind: "image", url, width: "100%", ...props },
  type: "ImageBlock",
});

const iconBox = (icon: string, title: string, description: string): TemplateBlock => ({
  props: {
    alignItems: "center",
    background: "transparent",
    borderColor: "transparent",
    borderRadius: "0",
    borderWidth: "0",
    description,
    icon,
    iconColor: "var(--accent-gold)",
    iconSize: "var(--section-icon-size)",
    paddingBottom: "var(--section-space-sm)",
    paddingLeft: "var(--section-space-2xs)",
    paddingRight: "var(--section-space-2xs)",
    paddingTop: "var(--section-space-sm)",
    title,
    width: "100%",
  },
  type: "IconBoxBlock",
});

const heroSlider = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "HeroImageSliderBlock",
});

const featureZigzagList = (cards: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children: cards,
  props,
  type: "FeatureZigzagListBlock",
});

const featureZigzagCard = (props: Record<string, unknown>): TemplateBlock => ({
  props,
  type: "FeatureZigzagCardBlock",
});

const featureGridList = (cards: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children: cards,
  props,
  type: "FeatureGridListBlock",
});

const featureIconList = (icons: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children: icons,
  props,
  type: "FeatureIconListBlock",
});

const featureOrbitList = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "FeatureOrbitListBlock",
});

const featureTabbedList = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "FeatureTabbedListBlock",
});

const featureTestimonials = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "FeatureTestimonialListBlock",
});

const galleryMarquee = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "GalleryMarqueeBlock",
});

const feedCarousel = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props: { cardStyle: "editorial", feedType: "events", itemsPerScreen: 3, width: "100%", ...props },
  type: "FeedCarouselBlock",
});

const ctaInvitation = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "CtaInvitationBlock",
});

const ctaSimple = (props: Record<string, unknown> = {}): TemplateBlock => ({
  props,
  type: "CtaSimpleBlock",
});

function templateBlocks(templateId: PageLayoutTemplateId, title: string, routePath: string): TemplateBlock[] {
  switch (templateId) {
    case "welcome":
      return [
        section([
          stack([
            stack([
              text("Encounter grace", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
              text(title, "h1", { color: "var(--brand-primary)", lineHeight: "var(--section-title-line-height)", size: "var(--section-title-size)", weight: "var(--section-weight-bold)" }),
              text("Find meaningful community, grow in faith, and take your next step with us.", "p", { color: "var(--text-secondary)", size: "var(--section-body-size)" }),
            ], { gap: "var(--section-space-md)" }),
            row([
              button("Plan a visit", "/contact"),
              button("Learn more", "/about", { variant: "ghost" }),
            ]),
          ], { justifyContent: "space-between", minHeight: "var(--section-hero-slider-height)" }),
          heroSlider(),
        ], { columns: 2, gap: "var(--section-space-lg)", padding: "var(--section-hero-padding)" }),

        section([
          featureZigzagList([
            featureZigzagCard({
              description: "Create a welcoming digital home that helps people connect and take their next step.",
              imageAlt: "People gathering together",
              imageUrl: defaultHeroSliderImages[2],
              title: "A place to belong",
            }),
            featureZigzagCard({
              description: "Share resources, events, and opportunities with your community wherever they are.",
              imageAlt: "Community resources",
              imageUrl: defaultHeroSliderImages[1],
              title: "Stay connected",
            }),
          ]),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaInvitation(),
        ], { background: "var(--brand-primary)", padding: "var(--section-space-none)" }),

        section([
          galleryMarquee(),
        ], { padding: "var(--section-space-md) 0" }),

        section([
          featureOrbitList(),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          text("Upcoming events & gatherings", "h2", { color: "var(--brand-primary)", marginBottom: "var(--section-space-md)" }),
          feedCarousel({ cardStyle: "editorial", feedType: "events", itemsPerScreen: 3 }),
        ], { background: "var(--bg-card)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          featureTestimonials(),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaSimple(),
        ], { background: "var(--brand-primary)" }),
      ];

    case "about":
      return [
        section([
          stack([
            text("About our church", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
            text(title, "h1", { color: "var(--brand-primary)" }),
            text("Rooted in Scripture, shaped by grace, and called to love our neighbors.", "p"),
            row([
              button("Plan a visit", "/contact"),
              button("Our ministries", "/church", { variant: "secondary" }),
            ]),
          ], { gap: "var(--section-space-md)", justifyContent: "center" }),
          image(defaultHeroSliderImages[0], "Church worship and fellowship", { height: "420px" }),
        ], { columns: 2, gap: "var(--section-space-lg)", padding: "var(--section-hero-padding)" }),

        section([
          featureOrbitList(),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          featureZigzagList([
            featureZigzagCard({
              description: "Learn about how God has led our congregation from its founding, shaping our heart for discipleship and fellowship.",
              imageAlt: "Church history",
              imageUrl: defaultHeroSliderImages[1],
              title: "Our story & calling",
            }),
            featureZigzagCard({
              description: "We are committed to sharing the love of Jesus through meaningful worship, compassionate community care, and practical service.",
              imageAlt: "Community mission",
              imageUrl: defaultHeroSliderImages[2],
              title: "Our mission in the city",
            }),
          ]),
        ], { background: "var(--bg-surface)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          galleryMarquee(),
        ], { padding: "var(--section-space-md) 0" }),

        section([
          featureTestimonials(),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaInvitation({
            subtitle: "Join us this Sunday as we seek God and walk together in faith.",
            title: "You are welcome here",
          }),
        ], { background: "var(--brand-primary)", padding: "var(--section-space-none)" }),
      ];

    case "ministries":
      return [
        section([
          stack([
            stack([
              text("Ministries & Groups", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
              text(title, "h1", { color: "var(--brand-primary)" }),
              text("Discover places to grow, build lifelong friendships, and serve together.", "p"),
            ], { gap: "var(--section-space-md)" }),
            row([
              button("Find a group", "/church"),
              button("Contact ministry lead", "/contact", { variant: "ghost" }),
            ]),
          ], { justifyContent: "space-between", minHeight: "var(--section-hero-slider-height)" }),
          heroSlider(),
        ], { columns: 2, gap: "var(--section-space-lg)", padding: "var(--section-hero-padding)" }),

        section([
          featureTabbedList(),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          featureGridList([
            featureZigzagCard({
              description: "Engaging Bible teaching and joyful fellowship for children of all ages.",
              imageAlt: "Children ministry",
              imageUrl: defaultHeroSliderImages[0],
              layout: "vertical",
              title: "Kids & Families",
            }),
            featureZigzagCard({
              description: "Navigating faith, purpose, and friendship through high school and college.",
              imageAlt: "Youth ministry",
              imageUrl: defaultHeroSliderImages[1],
              layout: "vertical",
              title: "Youth & Students",
            }),
            featureZigzagCard({
              description: "Walking together through prayer, practical help, and compassionate care.",
              imageAlt: "Care ministry",
              imageUrl: defaultHeroSliderImages[2],
              layout: "vertical",
              title: "Care & Prayer",
            }),
          ]),
        ], { background: "var(--bg-surface)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          featureIconList([
            iconBox("heartHandshake", "Community Groups", "Connect weekly for Bible study, prayer, and life-giving community."),
            iconBox("sparkles", "Serving Teams", "Use your God-given talents to serve our church family and city."),
            iconBox("bookOpen", "Discipleship Courses", "Deepen your understanding of Scripture through guided lessons."),
          ]),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaInvitation({
            subtitle: "Whether greeting guests, mentoring youth, or leading worship, there is a place for you.",
            title: "Find your place to serve",
          }),
        ], { background: "var(--brand-primary)", padding: "var(--section-space-none)" }),
      ];

    case "events":
      return [
        section([
          stack([
            text("Church Calendar", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
            text(title, "h1", { align: "center", color: "var(--brand-primary)" }),
            text("Gather with us for worship, fellowship, learning, and community service.", "p", { align: "center" }),
            row([
              button("View full calendar", "/event"),
              button("Plan your visit", "/contact", { variant: "secondary" }),
            ], { justifyContent: "center" }),
          ], { alignItems: "center", gap: "var(--section-space-md)" }),
        ], { padding: "var(--section-hero-padding)" }),

        section([
          text("Upcoming gatherings & special events", "h2", { color: "var(--brand-primary)", marginBottom: "var(--section-space-md)" }),
          feedCarousel({ cardStyle: "split", feedType: "events", itemsPerScreen: 2 }),
        ], { background: "var(--bg-card)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          featureZigzagList([
            featureZigzagCard({
              description: "Inspiring music, biblical preaching, and programs for the whole family every Sunday at 9:00 AM & 11:00 AM.",
              imageAlt: "Sunday worship",
              imageUrl: defaultHeroSliderImages[0],
              title: "Sunday Worship Services",
            }),
            featureZigzagCard({
              description: "Take time during the week to pause, pray for one another, and study God's Word in an encouraging atmosphere.",
              imageAlt: "Midweek prayer",
              imageUrl: defaultHeroSliderImages[1],
              title: "Midweek Prayer & Fellowship",
            }),
          ]),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          galleryMarquee(),
        ], { padding: "var(--section-space-md) 0" }),

        section([
          text("Latest news & announcements", "h2", { color: "var(--brand-primary)", marginBottom: "var(--section-space-md)" }),
          feedCarousel({ cardStyle: "editorial", feedType: "articles", itemsPerScreen: 3 }),
        ], { background: "var(--bg-surface)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaInvitation({
            subtitle: "Join our church newsletter or subscribe to notifications for schedule updates.",
            title: "Never miss a gathering",
          }),
        ], { background: "var(--brand-primary)", padding: "var(--section-space-none)" }),
      ];

    case "contact":
      return [
        section([
          stack([
            text("Visit & Connect", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
            text(title, "h1", { color: "var(--brand-primary)" }),
            text("We would love to welcome you in person. Here is everything you need for your first visit.", "p"),
            row([
              button("Send a message", "mailto:hello@httlncvn.local"),
              button("View events", "/event", { variant: "secondary" }),
            ]),
          ], { gap: "var(--section-space-md)", justifyContent: "center" }),
          image(defaultHeroSliderImages[0], "Church entrance and welcoming community", { height: "400px" }),
        ], { columns: 2, gap: "var(--section-space-lg)", padding: "var(--section-hero-padding)" }),

        section([
          featureIconList([
            iconBox("mapPin", "Sunday Services", "Morning Service: 9:00 AM & 11:00 AM. Arrival assistance available for families."),
            iconBox("messageSquare", "Pastoral Care & Prayer", "Our pastors and prayer teams are always available to listen and pray with you."),
            iconBox("mail", "Church Office", "Have questions? Reach out at hello@httlncvn.local or visit during office hours."),
          ]),
        ], { background: "var(--bg-surface)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          featureTestimonials(),
        ], { padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaSimple({
            buttonLabel: "Plan your visit",
            subtitle: "Join us this Sunday and experience a warm, Christ-centered community.",
            title: "We cannot wait to meet you",
          }),
        ], { background: "var(--brand-primary)" }),
      ];

    default:
      return [
        section([
          stack([
            text(title, "h1", { align: "center", color: "var(--brand-primary)" }),
            text("A clean starting layout with modern typography and modular content sections.", "p", { align: "center" }),
            row([
              button("Learn more", routePath),
              button("Get in touch", "/contact", { variant: "secondary" }),
            ], { justifyContent: "center" }),
          ], { alignItems: "center", gap: "var(--section-space-md)" }),
        ], { padding: "var(--section-hero-padding)" }),

        section([
          featureIconList([
            iconBox("sparkles", "Modern Design", "Crafted with flexible typography, spacing tokens, and smooth responsive layouts."),
            iconBox("bookOpen", "Rich Content", "Easily customize text, images, sliders, and feeds with visual editors."),
            iconBox("users", "Community Focused", "Built to engage visitors, members, and ministry leaders effectively."),
          ]),
        ], { background: "var(--bg-surface)", padding: "var(--section-space-xl) var(--section-gutter)" }),

        section([
          ctaSimple(),
        ], { background: "var(--brand-primary)" }),
      ];
  }
}

export function createDefaultPageContent(
  title: string,
  routePath: string,
  templateId: PageLayoutTemplateId = "simple",
) {
  const content: Record<string, unknown> = {};
  let nodeIndex = 0;

  function addBlock(block: TemplateBlock, parent: string): string {
    nodeIndex += 1;
    const id = `layout-${nodeIndex}`;
    const childIds = (block.children ?? []).map((child) => addBlock(child, id));
    content[id] = {
      custom: {},
      displayName: block.type.replace(/Block$/, ""),
      hidden: false,
      isCanvas: Boolean(block.children),
      linkedNodes: {},
      nodes: childIds,
      parent,
      props: block.props ?? {},
      type: { resolvedName: block.type },
    };
    return id;
  }

  const rootNodes = templateBlocks(templateId, title, routePath).map((block) => addBlock(block, "ROOT"));
  content.ROOT = {
    custom: {},
    displayName: "PageCanvas",
    hidden: false,
    isCanvas: true,
    linkedNodes: {},
    nodes: rootNodes,
    parent: null,
    props: { background: "var(--bg-base)", maxWidth: "100%", padding: "0", width: "100%" },
    type: { resolvedName: "PageCanvas" },
  };

  return JSON.stringify(content);
}

export function createHomepageTemplateContent(content: string) {
  try {
    const parsed = JSON.parse(content) as Record<string, any>;
    const firstNodeId = parsed.ROOT?.nodes?.[0];

    if (firstNodeId && parsed[firstNodeId]?.props) {
      parsed[firstNodeId].props.height = "calc(100dvh - var(--site-header-height))";
      parsed[firstNodeId].props.minHeight = "calc(100dvh - var(--site-header-height))";
    }

    return JSON.stringify(parsed);
  } catch {
    return content;
  }
}

function isCraftContentRecord(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return "ROOT" in value;
}

export function ensureValidPageContent(
  content: string | null | undefined,
  title: string,
  routePath: string,
) {
  if (typeof content === "string" && content.trim()) {
    try {
      const parsed = JSON.parse(content) as Record<string, any>;
      if (isCraftContentRecord(parsed)) {
        if (parsed.ROOT && parsed.ROOT.props) {
          parsed.ROOT.props.maxWidth = "100%";
          parsed.ROOT.props.width = "100%";
          parsed.ROOT.props.margin = "0 auto";
        }
        return JSON.stringify(parsed);
      }
    } catch {
      // Fall back to safe default content.
    }
  }

  return createDefaultPageContent(title, routePath);
}
