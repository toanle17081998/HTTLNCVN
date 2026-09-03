export type Align = "left" | "center" | "right";
export type SizeValue = number | string;
export type FeedType = "articles" | "courses" | "events";
export type FeedCardStyle = "cinematic" | "editorial" | "minimal" | "split";

export type FeedItem = {
  accent?: string;
  coverImage?: string | null;
  description: string;
  href?: string;
  id?: string;
  kicker: string;
  slug?: string;
  title: string;
};

export type BoxProps = {
  background?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  bottom?: SizeValue;
  borderColor?: string;
  borderRadius?: SizeValue;
  borderWidth?: SizeValue;
  height?: SizeValue;
  hideOnDesktop?: boolean;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  left?: SizeValue;
  margin?: string;
  marginBottom?: SizeValue;
  marginLeft?: SizeValue;
  marginRight?: SizeValue;
  marginTop?: SizeValue;
  maxWidth?: SizeValue;
  minHeight?: SizeValue;
  minWidth?: SizeValue;
  mobileMargin?: string;
  mobileMaxWidth?: SizeValue;
  mobilePadding?: string;
  mobilePosition?: "static" | "relative";
  mobileWidth?: SizeValue;
  padding?: string;
  paddingBottom?: SizeValue;
  paddingLeft?: SizeValue;
  paddingRight?: SizeValue;
  paddingTop?: SizeValue;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  right?: SizeValue;
  top?: SizeValue;
  tabletMargin?: string;
  tabletMaxWidth?: SizeValue;
  tabletPadding?: string;
  tabletPosition?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  tabletWidth?: SizeValue;
  width?: SizeValue;
  zIndex?: SizeValue;
};

export type EditorBreakpoint = "desktop" | "tablet" | "mobile";

export type CtaScheduleItem = {
  description: string;
  time: string;
  title: string;
};

export type GalleryImageItem = {
  alt?: string;
  url: string;
};
