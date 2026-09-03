"use client";

import { useEditor } from "@craftjs/core";
import { X } from "lucide-react";
import { Input, Textarea, cn } from "@/components/ui";
import { Field, NativeSelect } from "../shared/settings";
import { getButtonVariantClass } from "../shared/helpers";
import { IconPicker, featureIconMap } from "../shared/iconList";
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

  return <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Content selection</p>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">Choose {feedType} to display</h4>
    </div>
    <div className="grid gap-2">
      <Field label="Content feed source">
        <NativeSelect onChange={(value) => setValue("feedType", value)} value={feedType}>
          <option value="articles">Articles</option>
          <option value="courses">Courses</option>
          <option value="events">Events</option>
        </NativeSelect>
      </Field>
    </div>
    <div className="grid gap-2">
      <div className="flex items-center justify-between"><span className="text-sm font-medium">Specific items</span><button className="text-xs font-semibold text-[var(--brand-primary)]" onClick={() => setValue("selectedItemIds", [])} type="button">Show all</button></div>
      <div className="grid max-h-52 gap-1 overflow-y-auto rounded-lg border border-[var(--border-subtle)] p-2">
        {items.map((item) => <label className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--brand-soft)]" key={item.id}>
          <input checked={selectedItemIds.includes(item.id)} onChange={() => toggleItem(item.id)} type="checkbox" />
          <span className="truncate">{item.title}</span>
        </label>)}
        {!items.length ? <span className="px-2 py-3 text-sm text-[var(--text-tertiary)]">No published items found.</span> : null}
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">No selection displays all published items.</p>
    </div>
  </div>;
}

export function ContentEditorDialog() {
  const { actions, nodeName, props, selectedId } = useEditor((state: any) => {
    const id = Array.from(state.events.selected ?? [])[0] as string | undefined;
    const node = id ? state.nodes[id] : null;
    return {
      nodeName: node?.data.name as string | undefined,
      props: (node?.data.props ?? {}) as Record<string, unknown>,
      selectedId: id ?? null,
    };
  });
  const editable = selectedId && (
    ["TextBlock", "ButtonBlock", "ImageBlock", "HeroImageSliderBlock", "FeatureZigzagListBlock", "FeatureGridListBlock", "FeatureIconListBlock", "FeatureOrbitListBlock", "FeatureTabbedListBlock", "FeatureTestimonialListBlock", "CtaInvitationBlock", "CtaSimpleBlock", "GalleryMarqueeBlock", "FeatureZigzagCardBlock", "IconBoxBlock", "FeedCarouselBlock"].includes(nodeName ?? "") ||
    (nodeName === "SectionBlock" && typeof props.backgroundImage === "string" && Boolean(props.backgroundImage))
  );

  if (!editable || !selectedId) return null;

  function setValue(key: string, value: unknown) {
    actions.setProp(selectedId!, (draft: Record<string, unknown>) => { draft[key] = value; });
  }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 p-4" onMouseDown={() => actions.selectNode()}>
    <div className="grid max-h-[85vh] w-full max-w-lg grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl bg-[var(--bg-elevated)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Content only</p><h3 className="text-lg font-semibold">Edit {nodeName?.replace("Block", "").replace("FeedCarousel", "gallery").toLowerCase()}</h3></div>
        <button aria-label="Close editor" className="rounded-lg border border-[var(--border-subtle)] p-2" onClick={() => actions.selectNode()} type="button"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid min-h-0 gap-4 overflow-y-auto overscroll-contain p-5">
        {nodeName === "TextBlock" ? <Field label="Text"><Textarea className="min-h-32" onChange={(event) => setValue("text", event.target.value)} value={String(props.text ?? "")} /></Field> : null}
        {nodeName === "ButtonBlock" ? <>
          <Field label="Button label"><Input onChange={(event) => setValue("label", event.target.value)} value={String(props.label ?? "")} /></Field>
          <Field label="URL"><Input onChange={(event) => setValue("href", event.target.value)} placeholder="/contact or https://..." value={String(props.href ?? "")} /></Field>
        </> : null}
        {nodeName === "ImageBlock" ? <>
          <Field label="Image or embed URL"><Input onChange={(event) => setValue("url", event.target.value)} value={String(props.url ?? "")} /></Field>
          <Field label="Alternative text"><Input onChange={(event) => setValue("alt", event.target.value)} value={String(props.alt ?? "")} /></Field>
        </> : null}
        {nodeName === "HeroImageSliderBlock" ? <>
          {Array.from({ length: 3 }, (_, index) => {
            const images = Array.isArray(props.images) ? props.images as string[] : [];
            const alts = Array.isArray(props.alts) ? props.alts as string[] : [];
            return <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
              <Field label={`Image ${index + 1} URL`}><Input onChange={(event) => { const next = [...images]; next[index] = event.target.value; setValue("images", next); }} value={images[index] ?? ""} /></Field>
              <Field label={`Image ${index + 1} alternative text`}><Input onChange={(event) => { const next = [...alts]; next[index] = event.target.value; setValue("alts", next); }} value={alts[index] ?? ""} /></Field>
            </div>;
          })}
        </> : null}
        {nodeName === "FeatureZigzagCardBlock" ? <>
          <Field label="Card title"><Input onChange={(event) => setValue("title", event.target.value)} value={String(props.title ?? "")} /></Field>
          <Field label="Card description"><Textarea className="min-h-24" onChange={(event) => setValue("description", event.target.value)} value={String(props.description ?? "")} /></Field>
          <Field label="Image URL"><Input onChange={(event) => setValue("imageUrl", event.target.value)} value={String(props.imageUrl ?? "")} /></Field>
          <Field label="Image alternative text"><Input onChange={(event) => setValue("imageAlt", event.target.value)} value={String(props.imageAlt ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm"><input checked={props.showButton !== false} onChange={(event) => setValue("showButton", event.target.checked)} type="checkbox" />Show action button</label>
          {props.showButton !== false ? <>
            <Field label="Button label"><Input onChange={(event) => setValue("buttonLabel", event.target.value)} value={String(props.buttonLabel ?? "")} /></Field>
            <Field label="Button URL"><Input onChange={(event) => setValue("buttonHref", event.target.value)} placeholder="/article or https://..." value={String(props.buttonHref ?? "")} /></Field>
          </> : null}
        </> : null}
        {["FeatureZigzagListBlock", "FeatureGridListBlock", "FeatureIconListBlock", "FeatureOrbitListBlock", "FeatureTabbedListBlock", "FeatureTestimonialListBlock"].includes(nodeName ?? "") ? <>
          <Field label="Section title (required)"><Input onBlur={(event) => { if (!event.target.value.trim()) setValue("sectionTitle", "Ways to grow together"); }} onChange={(event) => setValue("sectionTitle", event.target.value)} required value={String(props.sectionTitle ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showDescription !== false} onChange={(event) => setValue("showDescription", event.target.checked)} type="checkbox" />Show section description</label>
          {props.showDescription !== false ? <Field label="Section description (optional)"><Textarea className="min-h-24" onChange={(event) => setValue("sectionDescription", event.target.value)} value={String(props.sectionDescription ?? "")} /></Field> : null}
        </> : null}
        {nodeName === "FeatureOrbitListBlock" ? <>
          <Field label="Center transparent image URL (optional)"><Input onChange={(event) => setValue("centerImageUrl", event.target.value)} placeholder="PNG, WebP, or SVG URL" value={String(props.centerImageUrl ?? "")} /></Field>
          <Field label="Center image alternative text"><Input onChange={(event) => setValue("centerImageAlt", event.target.value)} value={String(props.centerImageAlt ?? "")} /></Field>
          {(Array.isArray(props.items) ? props.items as CoreValueItem[] : defaultCoreValues).slice(0, 4).map((item: CoreValueItem, index: number, items: CoreValueItem[]) => <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
            <Field label={`Value ${index + 1} icon`}><NativeSelect onChange={(value) => { const next = [...items]; next[index] = { ...item, icon: value as CoreValueItem["icon"] }; setValue("items", next); }} value={item.icon}>{Object.keys(featureIconMap).map((icon) => <option key={icon} value={icon}>{icon}</option>)}</NativeSelect></Field>
            <Field label="Title"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, title: event.target.value }; setValue("items", next); }} value={item.title} /></Field>
            <Field label="Description"><Textarea onChange={(event) => { const next = [...items]; next[index] = { ...item, description: event.target.value }; setValue("items", next); }} value={item.description} /></Field>
          </div>)}
        </> : null}
        {nodeName === "FeatureTabbedListBlock" ? <>
          {(Array.isArray(props.items) ? props.items as FeatureTabItem[] : []).map((item: FeatureTabItem, index: number, items: FeatureTabItem[]) => <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
            <Field label={`Item ${index + 1} title`}><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, title: event.target.value }; setValue("items", next); }} value={item.title} /></Field>
            <Field label="Description"><Textarea onChange={(event) => { const next = [...items]; next[index] = { ...item, description: event.target.value }; setValue("items", next); }} value={item.description} /></Field>
            <Field label="Image URL"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, imageUrl: event.target.value }; setValue("items", next); }} value={item.imageUrl} /></Field>
            <Field label="Image alternative text"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, imageAlt: event.target.value }; setValue("items", next); }} value={item.imageAlt} /></Field>
            <label className="flex items-center gap-2 text-sm"><input checked={item.showButton} onChange={(event) => { const next = [...items]; next[index] = { ...item, showButton: event.target.checked }; setValue("items", next); }} type="checkbox" />Show button</label>
            {item.showButton ? <><Field label="Button label"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, buttonLabel: event.target.value }; setValue("items", next); }} value={item.buttonLabel} /></Field><Field label="Button URL"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, buttonHref: event.target.value }; setValue("items", next); }} value={item.buttonHref} /></Field></> : null}
            <button className="justify-self-start text-sm font-semibold text-[var(--status-danger)]" onClick={() => setValue("items", items.filter((_, itemIndex: number) => itemIndex !== index))} type="button">Remove item</button>
          </div>)}
          <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => setValue("items", [...(Array.isArray(props.items) ? props.items as FeatureTabItem[] : []), { ...defaultFeatureTabs[0], title: "New ministry" }])} type="button">+ Add ministry</button>
        </> : null}
        {nodeName === "CtaInvitationBlock" ? <>
          <Field label="Section title (required)"><Input onChange={(event) => setValue("sectionTitle", event.target.value)} required value={String(props.sectionTitle ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showDescription !== false} onChange={(event) => setValue("showDescription", event.target.checked)} type="checkbox" />Show section description</label>
          {props.showDescription !== false ? <Field label="Section description"><Textarea className="min-h-20" onChange={(event) => setValue("sectionDescription", event.target.value)} value={String(props.sectionDescription ?? "")} /></Field> : null}
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Primary Button</p>
            <Field label="Button label"><Input onChange={(event) => setValue("button1Label", event.target.value)} value={String(props.button1Label ?? "")} /></Field>
            <Field label="Button URL"><Input onChange={(event) => setValue("button1Href", event.target.value)} placeholder="/contact or https://..." value={String(props.button1Href ?? "")} /></Field>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showSecondaryButton !== false} onChange={(event) => setValue("showSecondaryButton", event.target.checked)} type="checkbox" />Show second button</label>
            {props.showSecondaryButton !== false ? <>
              <Field label="Second button label"><Input onChange={(event) => setValue("button2Label", event.target.value)} value={String(props.button2Label ?? "")} /></Field>
              <Field label="Second button URL"><Input onChange={(event) => setValue("button2Href", event.target.value)} placeholder="/article or https://..." value={String(props.button2Href ?? "")} /></Field>
            </> : null}
          </div>
          <div className="grid gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Schedule items (max 4)</p>
            {(Array.isArray(props.items) ? props.items as Array<CtaScheduleItem & { number?: string }> : defaultCtaScheduleItems).slice(0, 4).map((item: CtaScheduleItem & { number?: string }, index: number, currentItems: Array<CtaScheduleItem & { number?: string }>) => (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--accent-gold)]">Item {index + 1}</span>
                  <button className="text-xs font-semibold text-[var(--status-danger)]" onClick={() => setValue("items", currentItems.filter((_, itemIndex: number) => itemIndex !== index))} type="button">Remove item</button>
                </div>
                <Field label="Number / Tag"><Input onChange={(event) => { const next = [...currentItems]; next[index] = { ...item, number: event.target.value }; setValue("items", next); }} value={item.number} /></Field>
                <Field label="Title"><Input onChange={(event) => { const next = [...currentItems]; next[index] = { ...item, title: event.target.value }; setValue("items", next); }} value={item.title} /></Field>
                <Field label="Time / Description"><Input onChange={(event) => { const next = [...currentItems]; next[index] = { ...item, description: event.target.value }; setValue("items", next); }} value={item.description} /></Field>
              </div>
            ))}
            {(Array.isArray(props.items) ? (props.items as CtaScheduleItem[]).length : defaultCtaScheduleItems.length) < 4 ? (
              <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => {
                const current = Array.isArray(props.items) ? (props.items as Array<CtaScheduleItem & { number?: string }>) : defaultCtaScheduleItems;
                if (current.length < 4) {
                  setValue("items", [...current, { description: "11:00 AM", number: `0${current.length + 1}`, time: "11:00 AM", title: "New service" }].slice(0, 4));
                }
              }} type="button">+ Add item</button>
            ) : null}
          </div>
        </> : null}
        {nodeName === "CtaSimpleBlock" ? <>
          <Field label="Section title (required)"><Input onChange={(event) => setValue("sectionTitle", event.target.value)} required value={String(props.sectionTitle ?? "")} /></Field>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showDescription !== false} onChange={(event) => setValue("showDescription", event.target.checked)} type="checkbox" />Show section description</label>
          {props.showDescription !== false ? <Field label="Section description"><Textarea className="min-h-20" onChange={(event) => setValue("sectionDescription", event.target.value)} value={String(props.sectionDescription ?? "")} /></Field> : null}
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Primary Button</p>
            <Field label="Button label"><Input onChange={(event) => setValue("button1Label", event.target.value)} value={String(props.button1Label ?? "")} /></Field>
            <Field label="Button URL"><Input onChange={(event) => setValue("button1Href", event.target.value)} placeholder="/article or https://..." value={String(props.button1Href ?? "")} /></Field>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <label className="flex items-center gap-2 text-sm font-medium"><input checked={Boolean(props.showSecondaryButton)} onChange={(event) => setValue("showSecondaryButton", event.target.checked)} type="checkbox" />Show second button</label>
            {props.showSecondaryButton ? <>
              <Field label="Second button label"><Input onChange={(event) => setValue("button2Label", event.target.value)} value={String(props.button2Label ?? "")} /></Field>
              <Field label="Second button URL"><Input onChange={(event) => setValue("button2Href", event.target.value)} placeholder="/contact or https://..." value={String(props.button2Href ?? "")} /></Field>
            </> : null}
          </div>
        </> : null}
        {nodeName === "FeatureTestimonialListBlock" ? <>
          {(Array.isArray(props.items) ? props.items as TestimonialItem[] : []).map((item: TestimonialItem, index: number, items: TestimonialItem[]) => <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
            <Field label={`Group or Ministry ${index + 1}`}><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, organization: event.target.value }; setValue("items", next); }} value={item.organization} /></Field>
            <Field label="Logo URL (optional)"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, logoUrl: event.target.value }; setValue("items", next); }} value={item.logoUrl} /></Field>
            <Field label="Quote"><Textarea onChange={(event) => { const next = [...items]; next[index] = { ...item, quote: event.target.value }; setValue("items", next); }} value={item.quote} /></Field>
            <Field label="Name"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, name: event.target.value }; setValue("items", next); }} value={item.name} /></Field>
            <Field label="Role"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, role: event.target.value }; setValue("items", next); }} value={item.role} /></Field>
            <label className="flex items-center gap-2 text-sm"><input checked={item.showButton} onChange={(event) => { const next = [...items]; next[index] = { ...item, showButton: event.target.checked }; setValue("items", next); }} type="checkbox" />Show button</label>
            {item.showButton ? <><Field label="Button label"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, buttonLabel: event.target.value }; setValue("items", next); }} value={item.buttonLabel} /></Field><Field label="Button URL"><Input onChange={(event) => { const next = [...items]; next[index] = { ...item, buttonHref: event.target.value }; setValue("items", next); }} value={item.buttonHref} /></Field></> : null}
            <button className="justify-self-start text-sm font-semibold text-[var(--status-danger)]" onClick={() => setValue("items", items.filter((_, itemIndex: number) => itemIndex !== index))} type="button">Remove testimonial</button>
          </div>)}
          <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => setValue("items", [...(Array.isArray(props.items) ? props.items as TestimonialItem[] : []), { ...defaultTestimonials[0], name: "New member" }])} type="button">+ Add testimonial</button>
        </> : null}
        {nodeName === "SectionBlock" ? <Field label="Background image URL"><Input onChange={(event) => setValue("backgroundImage", event.target.value)} placeholder="https://..." value={String(props.backgroundImage ?? "")} /></Field> : null}
        {nodeName === "IconBoxBlock" ? <>
          <Field label="Choose Icon">
            <IconPicker
              onChange={(newIcon) => setValue("icon", newIcon)}
              value={String(props.icon ?? "users")}
            />
          </Field>
          <Field label="Title"><Input onChange={(event) => setValue("title", event.target.value)} value={String(props.title ?? "")} /></Field>
          <Field label="Description"><Textarea className="min-h-24" onChange={(event) => setValue("description", event.target.value)} value={String(props.description ?? "")} /></Field>
        </> : null}
        {nodeName === "GalleryMarqueeBlock" ? <>
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showTitle !== false} onChange={(event) => setValue("showTitle", event.target.checked)} type="checkbox" />Show title</label>
          {props.showTitle !== false ? <Field label="Title (optional)"><Input onChange={(event) => setValue("title", event.target.value)} value={String(props.title ?? "")} /></Field> : null}
          <label className="flex items-center gap-2 text-sm font-medium"><input checked={props.showSubtitle !== false} onChange={(event) => setValue("showSubtitle", event.target.checked)} type="checkbox" />Show subtitle</label>
          {props.showSubtitle !== false ? <Field label="Subtitle (optional)"><Textarea className="min-h-20" onChange={(event) => setValue("subtitle", event.target.value)} value={String(props.subtitle ?? "")} /></Field> : null}
          <Field label="Scroll direction">
            <NativeSelect onChange={(value) => setValue("direction", value)} value={String(props.direction ?? "left")}>
              <option value="left">Left to Right (← Scrolls Left)</option>
              <option value="right">Right to Left (→ Scrolls Right)</option>
            </NativeSelect>
          </Field>
          <div className="grid gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Images list</p>
            {(Array.isArray(props.images) ? props.images as GalleryImageItem[] : defaultGalleryImages).map((img: GalleryImageItem, index: number, currentImages: GalleryImageItem[]) => (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-3" key={index}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--accent-gold)]">Image {index + 1}</span>
                  <button className="text-xs font-semibold text-[var(--status-danger)]" onClick={() => setValue("images", currentImages.filter((_, imgIndex: number) => imgIndex !== index))} type="button">Remove image</button>
                </div>
                <Field label="Image URL"><Input onChange={(event) => { const next = [...currentImages]; next[index] = { ...img, url: event.target.value }; setValue("images", next); }} value={img.url} /></Field>
                <Field label="Alternative text (optional)"><Input onChange={(event) => { const next = [...currentImages]; next[index] = { ...img, alt: event.target.value }; setValue("images", next); }} value={img.alt ?? ""} /></Field>
              </div>
            ))}
            <button className="justify-self-start text-sm font-semibold text-[var(--brand-primary)]" onClick={() => {
              const current = Array.isArray(props.images) ? (props.images as GalleryImageItem[]) : defaultGalleryImages;
              setValue("images", [...current, { alt: "New gallery image", url: defaultGalleryImages[0].url }]);
            }} type="button">+ Add image</button>
          </div>
        </> : null}
        {nodeName === "FeedCarouselBlock" ? <GalleryBindingFields feedType={(props.feedType as FeedType) ?? "articles"} selectedItemIds={Array.isArray(props.selectedItemIds) ? props.selectedItemIds as string[] : []} setValue={setValue} /> : null}
        <button
          className={cn(
            "justify-self-end rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300",
            getButtonVariantClass("primary"),
          )}
          onClick={() => actions.selectNode()}
          type="button"
        >
          Done
        </button>
      </div>
    </div>
  </div>;
}
