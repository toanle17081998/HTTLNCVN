export * from "./layout/PageCanvas";
export * from "./layout/SectionBlock";
export * from "./layout/ColumnsBlock";
export * from "./layout/StackBlocks";
export * from "./basic/TextBlock";
export * from "./basic/ButtonBlock";
export * from "./basic/ImageBlock";
export * from "./basic/SeparatorBlock";
export * from "./basic/IconBoxBlock";
export * from "./interactive/AccordionBlock";
export * from "./interactive/TabsBlock";
export * from "./hero/HeroImageSliderBlock";
export * from "./features/FeatureZigzagBlock";
export * from "./features/FeatureGridListBlock";
export * from "./features/FeatureIconListBlock";
export * from "./features/FeatureOrbitListBlock";
export * from "./features/FeatureTabbedListBlock";
export * from "./features/FeatureTestimonialListBlock";
export * from "./cta/CtaInvitationBlock";
export * from "./cta/CtaSimpleBlock";
export * from "./gallery/GalleryMarqueeBlock";
export * from "./gallery/FeedCard";
export * from "./gallery/FeedCarouselBlock";

import { PageCanvas } from "./layout/PageCanvas";
import { SectionBlock } from "./layout/SectionBlock";
import { ColumnsBlock } from "./layout/ColumnsBlock";
import { RowBlock, VerticalStackBlock } from "./layout/StackBlocks";
import { TextBlock } from "./basic/TextBlock";
import { ButtonBlock } from "./basic/ButtonBlock";
import { ImageBlock } from "./basic/ImageBlock";
import { SeparatorBlock } from "./basic/SeparatorBlock";
import { IconBoxBlock } from "./basic/IconBoxBlock";
import { AccordionBlock } from "./interactive/AccordionBlock";
import { TabsBlock } from "./interactive/TabsBlock";
import { HeroImageSliderBlock } from "./hero/HeroImageSliderBlock";
import { FeatureZigzagCardBlock, FeatureZigzagListBlock } from "./features/FeatureZigzagBlock";
import { FeatureGridListBlock } from "./features/FeatureGridListBlock";
import { FeatureIconListBlock } from "./features/FeatureIconListBlock";
import { FeatureOrbitListBlock } from "./features/FeatureOrbitListBlock";
import { FeatureTabbedListBlock } from "./features/FeatureTabbedListBlock";
import { FeatureTestimonialListBlock } from "./features/FeatureTestimonialListBlock";
import { CtaInvitationBlock } from "./cta/CtaInvitationBlock";
import { CtaSimpleBlock } from "./cta/CtaSimpleBlock";
import { GalleryMarqueeBlock } from "./gallery/GalleryMarqueeBlock";
import { FeedCarouselBlock } from "./gallery/FeedCarouselBlock";

export const craftResolver = {
  AccordionBlock,
  ButtonBlock,
  ColumnsBlock,
  CtaInvitationBlock,
  CtaSimpleBlock,
  FeatureGridListBlock,
  FeatureIconListBlock,
  FeatureOrbitListBlock,
  FeatureTabbedListBlock,
  FeatureTestimonialListBlock,
  FeatureZigzagCardBlock,
  FeatureZigzagListBlock,
  FeedCarouselBlock,
  GalleryMarqueeBlock,
  HeroImageSliderBlock,
  IconBoxBlock,
  ImageBlock,
  PageCanvas,
  RowBlock,
  SectionBlock,
  SeparatorBlock,
  TabsBlock,
  TextBlock,
  VerticalStackBlock,
};
