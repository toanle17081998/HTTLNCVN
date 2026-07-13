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
  { id: "simple", name: "Simple page", description: "A clean title, introduction, and action." },
  { id: "welcome", name: "Welcome landing", description: "A copy of the current homepage layout and content." },
  { id: "about", name: "About our church", description: "Mission, story, photography, and a closing invitation." },
  { id: "ministries", name: "Ministries", description: "Introduction and three ministry feature columns." },
  { id: "events", name: "Events", description: "Event introduction with a live upcoming-events carousel." },
  { id: "contact", name: "Visit and contact", description: "Service information, location, and contact actions." },
];

type TemplateBlock = {
  children?: TemplateBlock[];
  props?: Record<string, unknown>;
  type: string;
};

const text = (value: string, tag: "h1" | "h2" | "h3" | "p" = "p", props: Record<string, unknown> = {}): TemplateBlock => ({
  props: {
    color: tag === "p" ? "var(--text-secondary)" : "var(--text-primary)",
    lineHeight: tag === "p" ? "1.7" : "1.15",
    size: tag === "h1" ? "52px" : tag === "h2" ? "36px" : tag === "h3" ? "24px" : "16px",
    tag,
    text: value,
    weight: tag === "p" ? "400" : "700",
    ...props,
  },
  type: "TextBlock",
});

const stack = (children: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children,
  props: { alignItems: "stretch", direction: "column", gap: "18px", ...props },
  type: "VerticalStackBlock",
});

const row = (children: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children,
  props: { alignItems: "center", gap: "12px", justifyContent: "flex-start", wrap: "wrap", ...props },
  type: "RowBlock",
});

const section = (children: TemplateBlock[], props: Record<string, unknown> = {}): TemplateBlock => ({
  children,
  props: {
    background: "transparent",
    borderColor: "transparent",
    borderRadius: "0",
    borderWidth: "0",
    columns: 1,
    gap: "32px",
    marginBottom: "0",
    marginLeft: "0",
    marginRight: "0",
    marginTop: "0",
    padding: "64px 32px",
    width: "100%",
    ...props,
  },
  type: "SectionBlock",
});

const button = (label: string, href: string): TemplateBlock => ({
  props: { align: "left", href, label },
  type: "ButtonBlock",
});

const image = (url: string, alt: string, props: Record<string, unknown> = {}): TemplateBlock => ({
  props: { alt, borderRadius: "6px", fit: "cover", height: "420px", kind: "image", url, width: "100%", ...props },
  type: "ImageBlock",
});

const iconBox = (icon: string, title: string, description: string): TemplateBlock => ({
  props: {
    background: "transparent",
    borderColor: "transparent",
    borderRadius: "0",
    borderWidth: "0",
    description,
    icon,
    iconColor: "var(--accent-gold)",
    iconSize: "28px",
    paddingBottom: "16px",
    paddingLeft: "8px",
    paddingRight: "8px",
    paddingTop: "16px",
    title,
    width: "100%",
  },
  type: "IconBoxBlock",
});

function templateBlocks(templateId: PageLayoutTemplateId, title: string, routePath: string): TemplateBlock[] {
  const churchImage = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85";

  switch (templateId) {
    case "welcome":
      return [
        section([stack([
          text("Encounter grace", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
          text(title, "h1", { color: "var(--text-inverse)", maxWidth: "760px", size: "64px" }),
          text("Growing together to become more like Jesus.", "p", { color: "var(--text-inverse-muted)", size: "20px" }),
          row([button("Plan a visit", "/contact"), button("Watch online", "/article")]),
        ], { justifyContent: "center", maxWidth: "820px" })], {
          background: `linear-gradient(90deg, rgba(12,16,38,.9), rgba(12,16,38,.34)), url(${churchImage}) center/cover`,
          height: "calc(100dvh - var(--site-header-height))",
          minHeight: "calc(100dvh - var(--site-header-height))",
          padding: "120px 7vw",
        }),
        section([
          image(churchImage, "Church family worshiping together", { height: "520px" }),
          stack([
            text("Welcome to", "p", { color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
            text("A church to call home", "h2"),
            text("Following Jesus brings hope, purpose, and a new way to live. Whether church is familiar or completely new, there is a place for you here."),
            text("Come meet a community where every generation can worship, grow, and serve together."),
            button("More about us", "/about"),
          ], { justifyContent: "center" }),
        ], { columns: 2, gap: "56px", padding: "88px 7vw" }),
        section([
          stack([
            text("Join us this Sunday", "h2", { align: "center" }),
            text("Add your church address and arrival details here.", "p", { align: "center", size: "18px" }),
            row([button("Get directions", "/contact"), button("Watch online", "/article")], { justifyContent: "center" }),
          ], { alignItems: "center" }),
          section([
            iconBox("01", "Bible class", "9:00 AM"),
            iconBox("02", "Fellowship", "10:00 AM"),
            iconBox("03", "Live stream", "10:20 AM"),
            iconBox("04", "Worship service", "10:30 AM"),
          ], { columns: 4, padding: "32px 0 0" }),
        ], { background: "var(--bg-card)", padding: "72px 7vw" }),
        section([
          stack([
            text("Get involved", "p", { align: "center", color: "var(--accent-gold)", letterSpacing: "2px", weight: "600" }),
            text("Everyone has a next step", "h2", { align: "center" }),
          ], { alignItems: "center" }),
          section([
            stack([image(churchImage, "Baptism", { height: "240px" }), text("Baptism", "h3"), text("A public declaration of faith and new life in Christ."), button("Learn more", "/about")]),
            stack([image(churchImage, "Children learning together", { height: "240px" }), text("Children and families", "h3"), text("A joyful, safe place for children to learn about Jesus."), button("Explore ministry", "/course")]),
            stack([image(churchImage, "Small group community", { height: "240px" }), text("Join a group", "h3"), text("Connect, grow, and find meaningful community."), button("Find community", "/church-unit")]),
          ], { columns: 3, gap: "28px", padding: "24px 0 0" }),
        ], { padding: "88px 7vw" }),
        section([stack([
          text("A place of connection, community, and comfort; a church family where you can grow in faith and find your place to serve.", "h2", { align: "center", color: "var(--text-inverse)", lineHeight: "1.4", maxWidth: "980px", size: "38px" }),
        ], { alignItems: "center" })], { background: "var(--brand-primary)", padding: "96px 7vw" }),
        section([
          text("Upcoming events", "h2"),
          { props: { cardStyle: "editorial", feedType: "events", itemsPerScreen: 3, width: "100%" }, type: "FeedCarouselBlock" },
        ], { background: "var(--bg-card)", padding: "80px 7vw" }),
        section([
          stack([text("Give with purpose", "h2"), text("Generosity supports worship, care, discipleship, and service in our community."), button("Learn about giving", "/contact")], { background: "var(--bg-surface)", justifyContent: "center", padding: "40px 48px 56px" }),
          stack([text("Welcome home", "h2", { color: "var(--text-inverse)" }), text("We cannot wait to meet you this Sunday.", "p", { color: "var(--text-inverse-muted)", size: "20px" }), button("Plan your visit", "/contact")], { background: "var(--brand-primary-strong)", justifyContent: "center", padding: "40px 48px 56px" }),
        ], { columns: 2, gap: "0", padding: "0" }),
        section([stack([text("Grow in faith", "h2", { align: "center" }), text("Explore Bible teaching and practical resources for every season of life.", "p", { align: "center" }), button("Browse courses", "/course")], { alignItems: "center" })]),
        section([image(churchImage, "Church community serving together", { height: "380px" }), stack([text("Love our city", "h2"), text("We serve our neighbors with compassion and share the hope of Jesus through practical action."), button("Serve with us", "/contact")], { justifyContent: "center" })], { background: "var(--bg-card)", columns: 2 }),
        section([stack([text("Stay connected", "h2", { align: "center" }), text("Receive church news, stories, and upcoming gathering details.", "p", { align: "center" }), button("Read the latest", "/article")], { alignItems: "center" })]),
      ];
    case "about":
      return [
        section([stack([text("About our church", "p", { color: "var(--accent-gold)", weight: "600" }), text(title, "h1"), text("Rooted in Scripture, shaped by grace, and called to love our neighbors.")])]),
        section([
          image(churchImage, "Church worship and fellowship"),
          stack([text("Our story", "h2"), text("Share the story of your congregation, its calling, and the people God has brought together."), text("Our mission", "h3"), text("Describe how your church worships, disciples, and serves with faithfulness and compassion.")], { justifyContent: "center" }),
        ], { columns: 2 }),
        section([stack([text("You are welcome here", "h2", { align: "center" }), text("Join us as we seek God and walk together in faith.", "p", { align: "center" }), button("Visit this Sunday", "/contact")], { alignItems: "center" })], { background: "var(--bg-card)" }),
        section([text("What we believe", "h2"), section([iconBox("01", "Jesus at the center", "We follow Jesus as Savior and Lord."), iconBox("02", "Rooted in Scripture", "The Bible shapes our faith and life."), iconBox("03", "Led by the Spirit", "We depend on God in worship and mission.")], { columns: 3, padding: "24px 0 0" })]),
        section([stack([text("Our values", "h2"), text("Grace, truth, prayer, community, generosity, and service guide how we live together.")]), image(churchImage, "Church members sharing life together", { height: "360px" })], { background: "var(--bg-surface)", columns: 2 }),
        section([stack([text("Meet our community", "h2", { align: "center" }), text("Discover the people and ministries that make up our church family.", "p", { align: "center" }), button("Find your place", "/church-unit")], { alignItems: "center" })]),
      ];
    case "ministries":
      return [
        section([stack([text(title, "h1"), text("Find a place to grow, belong, and serve.")])]),
        section([
          stack([text("Children and families", "h3"), text("A safe and joyful place for children to know God and build lasting friendships."), button("Learn more", routePath)]),
          stack([text("Youth community", "h3"), text("Helping young people follow Jesus with courage, wisdom, and genuine community."), button("Learn more", routePath)]),
          stack([text("Care and prayer", "h3"), text("Walking alongside one another through prayer, encouragement, and practical care."), button("Learn more", "/prayer-journal")]),
        ], { background: "var(--bg-surface)", columns: 3 }),
        section([stack([text("Serve with us", "h2"), text("Use your gifts to bless the church and the wider community."), button("Get connected", "/contact")], { alignItems: "center" })], { background: "var(--bg-card)" }),
        section([image(churchImage, "People growing through ministry", { height: "380px" }), stack([text("Grow together", "h2"), text("Every ministry creates space to learn Scripture, build friendships, and practice faith together."), button("Explore courses", "/course")], { justifyContent: "center" })], { columns: 2 }),
        section([text("Ways to take part", "h2"), section([iconBox("01", "Join a group", "Build consistent, life-giving community."), iconBox("02", "Serve a team", "Use your gifts alongside others."), iconBox("03", "Invite a friend", "Help someone find a place to belong.")], { columns: 3, padding: "24px 0 0" })], { background: "var(--bg-surface)" }),
        section([stack([text("Not sure where to begin?", "h2", { align: "center" }), text("Tell us a little about yourself and we will help you find a next step.", "p", { align: "center" }), button("Talk with our team", "/contact")], { alignItems: "center" })]),
      ];
    case "events":
      return [
        section([stack([text(title, "h1"), text("Gather with us for worship, fellowship, learning, and service.")])]),
        section([
          text("Upcoming gatherings", "h2"),
          { props: { cardStyle: "split", feedType: "events", itemsPerScreen: 2, width: "100%" }, type: "FeedCarouselBlock" },
        ], { paddingTop: "24px" }),
        section([stack([text("Looking for something specific?", "h2"), text("Contact our church office and we will help you find the right gathering."), button("Contact us", "/contact")])], { background: "var(--bg-card)" }),
        section([image(churchImage, "Church gathering", { height: "380px" }), stack([text("Gather with purpose", "h2"), text("Our gatherings make room for worship, friendship, learning, and serving our neighbors."), button("Plan your visit", "/contact")], { justifyContent: "center" })], { columns: 2 }),
        section([text("What to expect", "h2"), section([iconBox("01", "A warm welcome", "Friendly people will help you find your way."), iconBox("02", "Meaningful worship", "Songs, prayer, and biblical teaching."), iconBox("03", "Room for family", "Gatherings designed for every generation.")], { columns: 3, padding: "24px 0 0" })], { background: "var(--bg-surface)" }),
        section([stack([text("Never miss a gathering", "h2", { align: "center" }), text("Follow church news and announcements for the latest schedule updates.", "p", { align: "center" }), button("Read announcements", "/article")], { alignItems: "center" })]),
      ];
    case "contact":
      return [
        section([stack([text(title, "h1"), text("We would be honored to welcome you and help you feel at home.")])]),
        section([
          stack([text("Join us in worship", "h2"), text("Sunday worship\n9:00 AM and 11:00 AM"), text("Add your church address and arrival information here."), button("View events", "/event")]),
          stack([text("Get in touch", "h2"), text("General questions\nhello@httlncvn.local"), text("Prayer and pastoral care\nWe are ready to listen and pray with you."), button("Send a message", "mailto:hello@httlncvn.local")]),
        ], { columns: 2 }),
        section([text("Everyone is welcome", "h2", { align: "center" }), text("Come as you are. We look forward to meeting you.", "p", { align: "center" })], { background: "var(--bg-card)" }),
        section([image(churchImage, "Church entrance and welcome team", { height: "380px" }), stack([text("Plan your first visit", "h2"), text("Arrive a few minutes early and our welcome team will help with parking, seating, and children’s check-in."), button("View upcoming events", "/event")], { justifyContent: "center" })], { columns: 2 }),
        section([text("How we can help", "h2"), section([iconBox("01", "General questions", "Ask about services, programs, or facilities."), iconBox("02", "Prayer request", "Let our pastoral team pray with you."), iconBox("03", "Pastoral care", "Find support for difficult seasons.")], { columns: 3, padding: "24px 0 0" })], { background: "var(--bg-surface)" }),
        section([stack([text("Connect beyond Sunday", "h2", { align: "center" }), text("Find a group, ministry, or serving team where you can belong.", "p", { align: "center" }), button("Explore church life", "/church-unit")], { alignItems: "center" })]),
      ];
    default:
      return [
        section([stack([text(title, "h1"), text(`This page is mapped to ${routePath}.`), button("Preview page", routePath)])], { padding: "48px 32px" }),
        section([stack([text("Share your message", "h2"), text("Use this section to introduce the purpose of the page and the people it serves.")]), image(churchImage, "Church community", { height: "360px" })], { columns: 2 }),
        section([text("Key information", "h2"), section([iconBox("01", "First highlight", "Add an important detail here."), iconBox("02", "Second highlight", "Explain another helpful point."), iconBox("03", "Third highlight", "Invite visitors to take a next step.")], { columns: 3, padding: "24px 0 0" })], { background: "var(--bg-surface)" }),
        section([stack([text("Ready to learn more?", "h2", { align: "center" }), text("Add a clear closing invitation for your visitors.", "p", { align: "center" }), button("Contact us", "/contact")], { alignItems: "center" })], { background: "var(--bg-card)" }),
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
    props: { background: "var(--bg-base)", maxWidth: "100%", padding: "0" },
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

function isCraftContentRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const supportedResolvedNames = new Set([
    "PageCanvas",
    "SectionBlock",
    "ColumnsBlock",
    "RowBlock",
    "VerticalStackBlock",
    "TextBlock",
    "ButtonBlock",
    "ImageBlock",
    "SeparatorBlock",
    "IconBoxBlock",
    "AccordionBlock",
    "TabsBlock",
    "FeedCarouselBlock",
  ]);

  const record = value as Record<string, unknown>;

  if (!("ROOT" in record)) {
    return false;
  }

  return Object.values(record).every((nodeValue) => {
    if (!nodeValue || typeof nodeValue !== "object" || Array.isArray(nodeValue)) {
      return false;
    }

    const node = nodeValue as Record<string, unknown>;
    const type = node.type;
    const props = node.props;
    const nodes = node.nodes;

    if (!type || typeof type !== "object" || Array.isArray(type)) {
      return false;
    }

    const resolvedName = (type as Record<string, unknown>).resolvedName;

    return (
      typeof resolvedName === "string" &&
      supportedResolvedNames.has(resolvedName) &&
      Array.isArray(nodes) &&
      typeof props === "object" &&
      props !== null
    );
  });
}

export function ensureValidPageContent(
  content: string | null | undefined,
  title: string,
  routePath: string,
) {
  if (typeof content === "string" && content.trim()) {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (isCraftContentRecord(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      // Fall back to safe default content.
    }
  }

  return createDefaultPageContent(title, routePath);
}
