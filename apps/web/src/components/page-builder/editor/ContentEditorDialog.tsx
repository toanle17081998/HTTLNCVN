"use client";

import { useContext } from "react";
import { useEditor } from "@craftjs/core";
import { X } from "lucide-react";
import { Input, Textarea, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { Field, NativeSelect } from "../shared/settings";
import { getButtonVariantClass } from "../shared/helpers";
import { IconPicker, featureIconMap } from "../shared/iconList";
import { ContentEditContext } from "../shared/NodeFrame";
import { defaultHeroSliderImages } from "../blocks/hero/HeroImageSliderBlock";
import { defaultGalleryImages } from "../blocks/gallery/GalleryMarqueeBlock";
import { defaultCoreValues } from "../blocks/features/FeatureOrbitListBlock";
import { defaultFeatureTabs } from "../blocks/features/FeatureTabbedListBlock";
import { defaultTestimonials } from "../blocks/features/FeatureTestimonialListBlock";
import { useArticlesQuery } from "@/services/article";
import { useCoursesQuery } from "@/services/course";
import { useEventsQuery } from "@/services/event";
import type { CtaScheduleItem, FeedType, GalleryImageItem } from "../shared/types";
import type { FeatureTabItem } from "../blocks/features/FeatureTabbedListBlock";
import type { TestimonialItem } from "../blocks/features/FeatureTestimonialListBlock";
import type { CoreValueItem } from "../blocks/features/FeatureOrbitListBlock";

const defaultCtaScheduleItems: Array<CtaScheduleItem & { number?: string }> = [
  { description: "Prayer & Fellowship", number: "01", time: "08:00 AM", title: "Early Gathering" },
  { description: "Worship & Word with Kids Ministry", number: "02", time: "10:00 AM", title: "Main Service" },
  { description: "Youth & Young Adults", number: "03", time: "06:00 PM", title: "Evening Gathering" },
];

function GalleryBindingFields({
  feedType,
  selectedItemIds,
  setValue,
}: {
  feedType: FeedType;
  selectedItemIds: string[];
  setValue: (key: string, value: unknown) => void;
}) {
  const articlesQuery = useArticlesQuery({ status: "published", take: 50 });
  const coursesQuery = useCoursesQuery({ status: "published", take: 50 });
  const eventsQuery = useEventsQuery({ audience: "public", status: "published", upcoming: true, take: 50 });
  const items = feedType === "courses"
    ? (coursesQuery.data?.items ?? []).map((item) => ({ id: item.id, title: item.title_vi || item.title_en }))
    : feedType === "events"
      ? (eventsQuery.data?.items ?? []).map((item) => ({ id: item.id, title: item.title }))
      : (articlesQuery.data?.items ?? []).map((item) => ({ id: item.id, title: item.title_vi || item.title_en }));

  function toggleItem(id: string) {
    setValue("selectedItemIds", selectedItemIds.includes(id)
      ? selectedItemIds.filter((itemId) => itemId !== id)
      : [...selectedItemIds, id]);
  }

  const { t } = useTranslation();

  return <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{t("pageBuilder.contentSelection")}</p>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">{t("pageBuilder.chooseFeedType", { feedType })}</h4>
    </div>
    <div className="grid gap-2">
      <Field label={t("pageBuilder.feedSource")}>
        <NativeSelect onChange={(value) => setValue("feedType", value)} value={feedType}>
          <option value="articles">{t("footer.contact.general") || "Articles"}</option>
          <option value="courses">Courses</option>
          <option value="events">{t("footer.contact.events") || "Events"}</option>
        </NativeSelect>
      </Field>
    </div>
    <div className="grid gap-2">
      <div className="flex items-center justify-between"><span className="text-sm font-medium">{t("pageBuilder.specificItems")}</span><button className="text-xs font-semibold text-[var(--brand-primary)]" onClick={() => setValue("selectedItemIds", [])} type="button">{t("pageBuilder.showAll")}</button></div>
      <div className="grid max-h-52 gap-1 overflow-y-auto rounded-lg border border-[var(--border-subtle)] p-2">
        {items.map((item) => <label className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--brand-soft)]" key={item.id}>
          <input checked={selectedItemIds.includes(item.id)} onChange={() => toggleItem(item.id)} type="checkbox" />
          <span className="truncate">{item.title}</span>
        </label>)}
        {!items.length ? <span className="px-2 py-3 text-sm text-[var(--text-tertiary)]">{t("pageBuilder.noPublishedItems")}</span> : null}
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">{t("pageBuilder.noSelectionHelp")}</p>
    </div>
  </div>;
}

function EditableNodeFields({
  nodeId,
  nodeName,
  props,
  setValue,
}: {
  nodeId: string;
  nodeName: string;
  props: Record<string, unknown>;
  setValue: (nodeId: string, key: string, value: unknown) => void;
}) {
  const isHeading = nodeName === "TextBlock" && ["h1", "h2", "h3", "h4"].includes(String(props.tag ?? "p"));

  return (
    <div className="grid gap-3">
      {nodeName === "TextBlock" ? (
        <Field label={isHeading ? `Heading (${String(props.tag ?? "h1").toUpperCase()})` : "Text / Description"}>
          {isHeading ? (
            <Input onChange={(event) => setValue(nodeId, "text", event.target.value)} value={String(props.text ?? "")} />
          ) : (
            <Textarea className="min-h-24" onChange={(event) => setValue(nodeId, "text", event.target.value)} value={String(props.text ?? "")} />
          )}
        </Field>
      ) : null}

      {nodeName === "ButtonBlock" ? (
        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Action Button</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Button label"><Input onChange={(event) => setValue(nodeId, "label", event.target.value)} value={String(props.label ?? "")} /></Field>
            <Field label="URL"><Input onChange={(event) => setValue(nodeId, "href", event.target.value)} placeholder="/contact or https://..." value={String(props.href ?? "")} /></Field>
          </div>
        </div>
      ) : null}

      {nodeName === "ImageBlock" ? (
        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Image / Media</p>
          <Field label="Image URL"><Input onChange={(event) => setValue(nodeId, "url", event.target.value)} value={String(props.url ?? "")} /></Field>
          <Field label="Alternative text"><Input onChange={(event) => setValue(nodeId, "alt", event.target.value)} value={String(props.alt ?? "")} /></Field>
        </div>
      ) : null}

      {nodeName === "HeroImageSliderBlock" ? (
        <div className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Hero slider images (3)</p>
          {Array.from({ length: 3 }, (_, index) => {
            const images = Array.isArray(props.images) && props.images.length ? (props.images as string[]) : defaultHeroSliderImages;
            const alts = Array.isArray(props.alts) ? (props.alts as string[]) : [];
            return (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
                <Field label={`Image ${index + 1} URL`}><Input onChange={(event) => { const next = [...images]; next[index] = event.target.value; setValue(nodeId, "images", next); }} value={images[index] ?? ""} /></Field>
                <Field label={`Image ${index + 1} alternative text`}><Input onChange={(event) => { const next = [...alts]; next[index] = event.target.value; setValue(nodeId, "alts", next); }} value={alts[index] ?? ""} /></Field>
              </div>
            );
          })}
        </div>
      ) : null}

      {nodeName === "FeatureZigzagCardBlock" ? (
        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Feature Card</p>
          <Field label="Card title"><Input onChange={(event) => setValue(nodeId, "title", event.target.value)} value={String(props.title ?? "")} /></Field>
          <Field label="Card description"><Textarea className="min-h-20" onChange={(event) => setValue(nodeId, "description", event.target.value)} value={String(props.description ?? "")} /></Field>
          <Field label="Image URL"><Input onChange={(event) => setValue(nodeId, "imageUrl", event.target.value)} value={String(props.imageUrl ?? "")} /></Field>
          <Field label="Image alternative text"><Input onChange={(event) => setValue(nodeId, "imageAlt", event.target.value)} value={String(props.imageAlt ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm"><input checked={props.showButton !== false} onChange={(event) => setValue(nodeId, "showButton", event.target.checked)} type="checkbox" />Show action button</label>
          {props.showButton !== false ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Button label"><Input onChange={(event) => setValue(nodeId, "buttonLabel", event.target.value)} value={String(props.buttonLabel ?? "")} /></Field>
              <Field label="Button URL"><Input onChange={(event) => setValue(nodeId, "buttonHref", event.target.value)} placeholder="/about or https://..." value={String(props.buttonHref ?? "")} /></Field>
            </div>
          ) : null}
        </div>
      ) : null}

      {["FeatureZigzagListBlock", "FeatureGridListBlock", "FeatureIconListBlock", "FeatureOrbitListBlock", "FeatureTabbedListBlock", "FeatureTestimonialListBlock"].includes(nodeName) ? (
        <>
          <Field label="Section title (required)"><Input onBlur={(event) => { if (!event.target.value.trim()) setValue(nodeId, "sectionTitle", "Ways to grow together"); }} onChange={(event) => setValue(nodeId, "sectionTitle", event.target.value)} required value={String(props.sectionTitle ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showDescription !== false} onChange={(event) => setValue(nodeId, "showDescription", event.target.checked)} type="checkbox" />Show section description</label>
          {props.showDescription !== false ? <Field label="Section description (optional)"><Textarea className="min-h-20" onChange={(event) => setValue(nodeId, "sectionDescription", event.target.value)} value={String(props.sectionDescription ?? "")} /></Field> : null}
        </>
      ) : null}

      {nodeName === "FeatureOrbitListBlock" ? (
        <div className="grid gap-3">
          <Field label="Center transparent image URL (optional)"><Input onChange={(event) => setValue(nodeId, "centerImageUrl", event.target.value)} placeholder="PNG, WebP, or SVG URL" value={String(props.centerImageUrl ?? "")} /></Field>
          <Field label="Center image alternative text"><Input onChange={(event) => setValue(nodeId, "centerImageAlt", event.target.value)} value={String(props.centerImageAlt ?? "")} /></Field>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Core values (4)</p>
          {(Array.isArray(props.items) && props.items.length ? (props.items as CoreValueItem[]) : defaultCoreValues).slice(0, 4).map((item: CoreValueItem, index: number, items: CoreValueItem[]) => (
            <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
              <Field label={`Value ${index + 1} icon`}><NativeSelect onChange={(value) => { const next = [...items]; next[index] = { ...item, icon: value as CoreValueItem["icon"] }; setValue(nodeId, "items", next); }} value={item.icon}>{Object.keys(featureIconMap).map((icon) => <option key={icon} value={icon}>{icon}</option>)}</NativeSelect></Field>
              <Field label="Title"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, title: event.target.value }; setValue(nodeId, "items", next); }} value={item.title} /></Field>
              <Field label="Description"><Textarea onChange={(event) => { const next = [...items]; next[index] = { ...item, description: event.target.value }; setValue(nodeId, "items", next); }} value={item.description} /></Field>
            </div>
          ))}
        </div>
      ) : null}

      {nodeName === "FeatureTabbedListBlock" ? (
        <div className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ministries / Tabs</p>
          {(Array.isArray(props.items) && props.items.length ? (props.items as FeatureTabItem[]) : defaultFeatureTabs).map((item: FeatureTabItem, index: number, items: FeatureTabItem[]) => (
            <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
              <Field label={`Item ${index + 1} title`}><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, title: event.target.value }; setValue(nodeId, "items", next); }} value={item.title} /></Field>
              <Field label="Description"><Textarea onChange={(event) => { const next = [...items]; next[index] = { ...item, description: event.target.value }; setValue(nodeId, "items", next); }} value={item.description} /></Field>
              <Field label="Image URL"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, imageUrl: event.target.value }; setValue(nodeId, "items", next); }} value={item.imageUrl} /></Field>
              <Field label="Image alternative text"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, imageAlt: event.target.value }; setValue(nodeId, "items", next); }} value={item.imageAlt} /></Field>
              <label className="flex items-center gap-2 text-sm"><input checked={item.showButton} onChange={(event) => { const next = [...items]; next[index] = { ...item, showButton: event.target.checked }; setValue(nodeId, "items", next); }} type="checkbox" />Show button</label>
              {item.showButton ? (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Button label"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, buttonLabel: event.target.value }; setValue(nodeId, "items", next); }} value={item.buttonLabel} /></Field>
                  <Field label="Button URL"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, buttonHref: event.target.value }; setValue(nodeId, "items", next); }} value={item.buttonHref} /></Field>
                </div>
              ) : null}
              <button className="justify-self-start text-xs font-semibold text-[var(--status-danger)]" onClick={() => setValue(nodeId, "items", items.filter((_, itemIndex: number) => itemIndex !== index))} type="button">Remove item</button>
            </div>
          ))}
          <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => {
            const currentList = Array.isArray(props.items) && props.items.length ? (props.items as FeatureTabItem[]) : defaultFeatureTabs;
            setValue(nodeId, "items", [...currentList, { ...defaultFeatureTabs[0], title: "New ministry" }]);
          }} type="button">+ Add ministry</button>
        </div>
      ) : null}

      {nodeName === "FeatureTestimonialListBlock" ? (
        <div className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Testimonials</p>
          {(Array.isArray(props.items) && props.items.length ? (props.items as TestimonialItem[]) : defaultTestimonials).map((item: TestimonialItem, index: number, items: TestimonialItem[]) => (
            <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
              <Field label={`Group or Ministry ${index + 1}`}><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, organization: event.target.value }; setValue(nodeId, "items", next); }} value={item.organization} /></Field>
              <Field label="Photo / Image URL"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, imageUrl: event.target.value, logoUrl: event.target.value }; setValue(nodeId, "items", next); }} placeholder="https://..." value={item.imageUrl || item.logoUrl || ""} /></Field>
              <Field label="Quote"><Textarea onChange={(event) => { const next = [...items]; next[index] = { ...item, quote: event.target.value }; setValue(nodeId, "items", next); }} value={item.quote} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, name: event.target.value }; setValue(nodeId, "items", next); }} value={item.name} /></Field>
                <Field label="Role"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, role: event.target.value }; setValue(nodeId, "items", next); }} value={item.role} /></Field>
              </div>
              <button className="justify-self-start text-xs font-semibold text-[var(--status-danger)]" onClick={() => setValue(nodeId, "items", items.filter((_, itemIndex: number) => itemIndex !== index))} type="button">Remove testimonial</button>
            </div>
          ))}
          <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => {
            const currentList = Array.isArray(props.items) && props.items.length ? (props.items as TestimonialItem[]) : defaultTestimonials;
            setValue(nodeId, "items", [...currentList, { ...defaultTestimonials[0], name: "New member" }]);
          }} type="button">+ Add testimonial</button>
        </div>
      ) : null}

      {nodeName === "CtaInvitationBlock" ? (
        <div className="grid gap-3">
          <Field label="Section title (required)"><Input onChange={(event) => setValue(nodeId, "sectionTitle", event.target.value)} required value={String(props.sectionTitle ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showDescription !== false} onChange={(event) => setValue(nodeId, "showDescription", event.target.checked)} type="checkbox" />Show section description</label>
          {props.showDescription !== false ? <Field label="Section description"><Textarea className="min-h-20" onChange={(event) => setValue(nodeId, "sectionDescription", event.target.value)} value={String(props.sectionDescription ?? "")} /></Field> : null}
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Primary Button</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Button label"><Input onChange={(event) => setValue(nodeId, "button1Label", event.target.value)} value={String(props.button1Label ?? "")} /></Field>
              <Field label="Button URL"><Input onChange={(event) => setValue(nodeId, "button1Href", event.target.value)} placeholder="/contact or https://..." value={String(props.button1Href ?? "")} /></Field>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showSecondaryButton !== false} onChange={(event) => setValue(nodeId, "showSecondaryButton", event.target.checked)} type="checkbox" />Show second button</label>
            {props.showSecondaryButton !== false ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Second button label"><Input onChange={(event) => setValue(nodeId, "button2Label", event.target.value)} value={String(props.button2Label ?? "")} /></Field>
                <Field label="Second button URL"><Input onChange={(event) => setValue(nodeId, "button2Href", event.target.value)} placeholder="/article or https://..." value={String(props.button2Href ?? "")} /></Field>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Schedule items (max 4)</p>
            {(Array.isArray(props.items) ? (props.items as Array<CtaScheduleItem & { number?: string }>) : defaultCtaScheduleItems).slice(0, 4).map((item: CtaScheduleItem & { number?: string }, index: number, currentItems: Array<CtaScheduleItem & { number?: string }>) => (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--accent-gold)]">Item {index + 1}</span>
                  <button className="text-xs font-semibold text-[var(--status-danger)]" onClick={() => setValue(nodeId, "items", currentItems.filter((_, itemIndex: number) => itemIndex !== index))} type="button">Remove item</button>
                </div>
                <Field label="Number / Tag"><Input onChange={(event) => { const next = [...currentItems]; next[index] = { ...item, number: event.target.value }; setValue(nodeId, "items", next); }} value={item.number} /></Field>
                <Field label="Title"><Input onChange={(event) => { const next = [...currentItems]; next[index] = { ...item, title: event.target.value }; setValue(nodeId, "items", next); }} value={item.title} /></Field>
                <Field label="Time / Description"><Input onChange={(event) => { const next = [...currentItems]; next[index] = { ...item, description: event.target.value }; setValue(nodeId, "items", next); }} value={item.description} /></Field>
              </div>
            ))}
            {(Array.isArray(props.items) ? (props.items as CtaScheduleItem[]).length : defaultCtaScheduleItems.length) < 4 ? (
              <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => {
                const current = Array.isArray(props.items) ? (props.items as Array<CtaScheduleItem & { number?: string }>) : defaultCtaScheduleItems;
                if (current.length < 4) {
                  setValue(nodeId, "items", [...current, { description: "11:00 AM", number: `0${current.length + 1}`, time: "11:00 AM", title: "New service" }].slice(0, 4));
                }
              }} type="button">+ Add item</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {nodeName === "CtaSimpleBlock" ? (
        <div className="grid gap-3">
          <Field label="Section title (required)"><Input onChange={(event) => setValue(nodeId, "sectionTitle", event.target.value)} required value={String(props.sectionTitle ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showDescription !== false} onChange={(event) => setValue(nodeId, "showDescription", event.target.checked)} type="checkbox" />Show section description</label>
          {props.showDescription !== false ? <Field label="Section description"><Textarea className="min-h-20" onChange={(event) => setValue(nodeId, "sectionDescription", event.target.value)} value={String(props.sectionDescription ?? "")} /></Field> : null}
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Primary Button</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Button label"><Input onChange={(event) => setValue(nodeId, "button1Label", event.target.value)} value={String(props.button1Label ?? "")} /></Field>
              <Field label="Button URL"><Input onChange={(event) => setValue(nodeId, "button1Href", event.target.value)} placeholder="/article or https://..." value={String(props.button1Href ?? "")} /></Field>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <label className="flex items-center gap-2 text-sm font-medium"><input checked={Boolean(props.showSecondaryButton)} onChange={(event) => setValue(nodeId, "showSecondaryButton", event.target.checked)} type="checkbox" />Show second button</label>
            {props.showSecondaryButton ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Second button label"><Input onChange={(event) => setValue(nodeId, "button2Label", event.target.value)} value={String(props.button2Label ?? "")} /></Field>
                <Field label="Second button URL"><Input onChange={(event) => setValue(nodeId, "button2Href", event.target.value)} placeholder="/contact or https://..." value={String(props.button2Href ?? "")} /></Field>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {nodeName === "GalleryMarqueeBlock" ? (
        <div className="grid gap-3">
          <Field label="Title (optional)"><Input onChange={(event) => setValue(nodeId, "title", event.target.value)} value={String(props.title ?? "")} /></Field>
          <Field label="Subtitle (optional)"><Textarea className="min-h-20" onChange={(event) => setValue(nodeId, "subtitle", event.target.value)} value={String(props.subtitle ?? "")} /></Field>
          <Field label="Scroll direction">
            <NativeSelect onChange={(value) => setValue(nodeId, "direction", value)} value={String(props.direction ?? "left")}>
              <option value="left">Left to Right (← Scrolls Left)</option>
              <option value="right">Right to Left (→ Scrolls Right)</option>
            </NativeSelect>
          </Field>
          <div className="grid gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Images list</p>
            {(Array.isArray(props.images) && props.images.length ? (props.images as GalleryImageItem[]) : defaultGalleryImages).map((img: GalleryImageItem, index: number, currentImages: GalleryImageItem[]) => (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--accent-gold)]">Image {index + 1}</span>
                  <button className="text-xs font-semibold text-[var(--status-danger)]" onClick={() => setValue(nodeId, "images", currentImages.filter((_, imgIndex: number) => imgIndex !== index))} type="button">Remove image</button>
                </div>
                <Field label="Image URL"><Input onChange={(event) => { const next = [...currentImages]; next[index] = { ...img, url: event.target.value }; setValue(nodeId, "images", next); }} value={img.url} /></Field>
                <Field label="Alternative text (optional)"><Input onChange={(event) => { const next = [...currentImages]; next[index] = { ...img, alt: event.target.value }; setValue(nodeId, "images", next); }} value={img.alt ?? ""} /></Field>
              </div>
            ))}
            <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => {
              const current = Array.isArray(props.images) && props.images.length ? (props.images as GalleryImageItem[]) : defaultGalleryImages;
              setValue(nodeId, "images", [...current, { alt: "New gallery image", url: defaultGalleryImages[0].url }]);
            }} type="button">+ Add image</button>
          </div>
        </div>
      ) : null}

      {nodeName === "FeedCarouselBlock" ? (
        <GalleryBindingFields feedType={(props.feedType as FeedType) ?? "articles"} selectedItemIds={Array.isArray(props.selectedItemIds) ? (props.selectedItemIds as string[]) : []} setValue={(_, val) => setValue(nodeId, "selectedItemIds", val)} />
      ) : null}

      {nodeName === "IconBoxBlock" ? (
        <div className="grid gap-3">
          <Field label="Choose Icon">
            <IconPicker onChange={(newIcon) => setValue(nodeId, "icon", newIcon)} value={String(props.icon ?? "users")} />
          </Field>
          <Field label="Title"><Input onChange={(event) => setValue(nodeId, "title", event.target.value)} value={String(props.title ?? "")} /></Field>
          <Field label="Description"><Textarea className="min-h-24" onChange={(event) => setValue(nodeId, "description", event.target.value)} value={String(props.description ?? "")} /></Field>
        </div>
      ) : null}

      {nodeName === "SectionBlock" && typeof props.backgroundImage === "string" ? (
        <Field label="Section background image URL"><Input onChange={(event) => setValue(nodeId, "backgroundImage", event.target.value)} placeholder="https://..." value={String(props.backgroundImage ?? "")} /></Field>
      ) : null}
    </div>
  );
}

export function ContentEditorDialog() {
  const { t } = useTranslation();
  const { editingId, setEditingId } = useContext(ContentEditContext);
  const { actions, stateNodes } = useEditor((state: any) => ({
    stateNodes: state.nodes,
  }));

  if (!editingId || !stateNodes || !stateNodes[editingId]) return null;

  const editableBlockNames = [
    "TextBlock",
    "ButtonBlock",
    "ImageBlock",
    "HeroImageSliderBlock",
    "FeatureZigzagCardBlock",
    "FeatureZigzagListBlock",
    "FeatureGridListBlock",
    "FeatureIconListBlock",
    "FeatureOrbitListBlock",
    "FeatureTabbedListBlock",
    "FeatureTestimonialListBlock",
    "CtaInvitationBlock",
    "CtaSimpleBlock",
    "GalleryMarqueeBlock",
    "FeedCarouselBlock",
    "IconBoxBlock",
    "SectionBlock",
  ];

  const editableNodes: Array<{ id: string; name: string; props: Record<string, unknown> }> = [];
  const visited = new Set<string>();

  function traverse(nodeId: string) {
    if (!nodeId || visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = stateNodes[nodeId];
    if (!node) return;

    const rawName =
      (node.data?.type as any)?.resolvedName ||
      (node.data?.type as any)?.name ||
      node.data?.displayName ||
      node.data?.name ||
      "";

    const displayNameMap: Record<string, string> = {
      "Text": "TextBlock",
      "Button": "ButtonBlock",
      "Image / Video": "ImageBlock",
      "Hero image slider": "HeroImageSliderBlock",
      "Zigzag feature card": "FeatureZigzagCardBlock",
      "Zigzag feature list": "FeatureZigzagListBlock",
      "Grid feature cards": "FeatureGridListBlock",
      "Centered icon feature list": "FeatureIconListBlock",
      "Orbit core values": "FeatureOrbitListBlock",
      "Tabbed ministry list": "FeatureTabbedListBlock",
      "Community testimonials": "FeatureTestimonialListBlock",
      "Invitation and gathering schedule": "CtaInvitationBlock",
      "Simple call to action": "CtaSimpleBlock",
      "Infinite image marquee": "GalleryMarqueeBlock",
      "Feed Carousel": "FeedCarouselBlock",
      "Icon Feature Box": "IconBoxBlock",
      "Section": "SectionBlock",
    };

    const name = displayNameMap[rawName] || rawName;
    const props = (node.data?.props ?? {}) as Record<string, unknown>;

    if (name && editableBlockNames.includes(name)) {
      if (name === "SectionBlock") {
        if (typeof props.backgroundImage === "string" && props.backgroundImage) {
          editableNodes.push({ id: nodeId, name, props });
        }
      } else {
        editableNodes.push({ id: nodeId, name, props });
      }
    }

    const children = node.data?.nodes || [];
    for (const childId of children) {
      traverse(childId);
    }
  }

  traverse(editingId);

  const rootNode = stateNodes[editingId];
  const sectionTitle =
    (rootNode?.data?.props?.sectionName as string) ||
    (rootNode?.data?.props?.sectionTitle as string) ||
    (rootNode?.data?.displayName as string) ||
    "Section";

  function setValue(nodeId: string, key: string, value: unknown) {
    actions.setProp(nodeId, (draft: Record<string, unknown>) => {
      draft[key] = value;
    });
  }

  function handleClose() {
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4" onMouseDown={handleClose}>
      <div
        className="grid max-h-[85vh] w-full max-w-xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl bg-[var(--bg-elevated)] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{t("pageBuilder.sectionCms")}</p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t("pageBuilder.editSection", { name: sectionTitle })}</h3>
          </div>
          <button aria-label="Close editor" className="rounded-lg border border-[var(--border-subtle)] p-2 hover:bg-[var(--bg-surface)] cursor-pointer" onClick={handleClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid min-h-0 gap-6 overflow-y-auto overscroll-contain p-6">
          {editableNodes.length > 0 ? (
            editableNodes.map((node) => (
              <EditableNodeFields
                key={node.id}
                nodeId={node.id}
                nodeName={node.name}
                props={node.props}
                setValue={setValue}
              />
            ))
          ) : (
            <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
              {t("pageBuilder.noEditableFields")}
            </div>
          )}
          <button
            className={cn(
              "justify-self-end rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer",
              getButtonVariantClass("primary"),
            )}
            onClick={handleClose}
            type="button"
          >
            {t("pageBuilder.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
