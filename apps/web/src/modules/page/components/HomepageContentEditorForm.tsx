"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@services/client";
import {
  type HomepageContent,
  type UpdateHomepageContentDto,
  homepageKeys,
  useUpdateHomepageContentMutation,
} from "@services/homepage";
import { Button, Input, Textarea } from "@/components/ui";

type HomepageFormState = Required<UpdateHomepageContentDto> & {
  hero_image_urls_text: string;
};

function homepageContentToForm(content: HomepageContent): HomepageFormState {
  return {
    articles_eyebrow_en: content.section_headers.articles.eyebrow.en,
    articles_eyebrow_vi: content.section_headers.articles.eyebrow.vi,
    articles_title_en: content.section_headers.articles.title.en,
    articles_title_vi: content.section_headers.articles.title.vi,
    courses_eyebrow_en: content.section_headers.courses.eyebrow.en,
    courses_eyebrow_vi: content.section_headers.courses.eyebrow.vi,
    courses_title_en: content.section_headers.courses.title.en,
    courses_title_vi: content.section_headers.courses.title.vi,
    events_eyebrow_en: content.section_headers.events.eyebrow.en,
    events_eyebrow_vi: content.section_headers.events.eyebrow.vi,
    events_title_en: content.section_headers.events.title.en,
    events_title_vi: content.section_headers.events.title.vi,
    hero_eyebrow_en: content.eyebrow.en,
    hero_eyebrow_vi: content.eyebrow.vi,
    hero_headline_en: content.headline.en,
    hero_headline_vi: content.headline.vi,
    hero_image_urls: content.image_urls,
    hero_image_urls_text: content.image_urls.join("\n"),
    hero_subheadline_en: content.subheadline.en,
    hero_subheadline_vi: content.subheadline.vi,
    primary_cta_href: content.cta.href,
    primary_cta_label_en: content.cta.label.en,
    primary_cta_label_vi: content.cta.label.vi,
    secondary_cta_href: content.secondary_cta.href,
    secondary_cta_label_en: content.secondary_cta.label.en,
    secondary_cta_label_vi: content.secondary_cta.label.vi,
    stat_1_label_en: content.stats[0]?.label.en ?? "",
    stat_1_label_vi: content.stats[0]?.label.vi ?? "",
    stat_1_value: content.stats[0]?.value ?? "",
    stat_2_label_en: content.stats[1]?.label.en ?? "",
    stat_2_label_vi: content.stats[1]?.label.vi ?? "",
    stat_2_value: content.stats[1]?.value ?? "",
    stat_3_label_en: content.stats[2]?.label.en ?? "",
    stat_3_label_vi: content.stats[2]?.label.vi ?? "",
    stat_3_value: content.stats[2]?.value ?? "",
  };
}

export function HomepageContentEditorForm({ content }: { content: HomepageContent }) {
  const queryClient = useQueryClient();
  const updateHomepage = useUpdateHomepageContentMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<HomepageFormState>(() => homepageContentToForm(content));

  useEffect(() => {
    setForm(homepageContentToForm(content));
  }, [content]);

  function updateField<K extends keyof HomepageFormState>(field: K, value: HomepageFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const { hero_image_urls_text, ...payload } = form;
    const hero_image_urls = hero_image_urls_text
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);

    try {
      await updateHomepage.mutateAsync({ ...payload, hero_image_urls });
      queryClient.invalidateQueries({ queryKey: homepageKeys.content() });
      setMessage("Homepage blocks saved.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Could not save homepage blocks.");
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="grid gap-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-950">Hero Block</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextInput label="Eyebrow EN" name="hero_eyebrow_en" onChange={updateField} value={form.hero_eyebrow_en} />
          <TextInput label="Eyebrow VI" name="hero_eyebrow_vi" onChange={updateField} value={form.hero_eyebrow_vi} />
          <TextInput label="Headline EN" name="hero_headline_en" onChange={updateField} value={form.hero_headline_en} />
          <TextInput label="Headline VI" name="hero_headline_vi" onChange={updateField} value={form.hero_headline_vi} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaInput label="Subheadline EN" name="hero_subheadline_en" onChange={updateField} value={form.hero_subheadline_en} />
          <TextAreaInput label="Subheadline VI" name="hero_subheadline_vi" onChange={updateField} value={form.hero_subheadline_vi} />
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Hero image URLs
          <Textarea
            className="min-h-28 font-mono"
            onChange={(event) => updateField("hero_image_urls_text", event.target.value)}
            value={form.hero_image_urls_text}
          />
        </label>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-950">Calls To Action</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextInput label="Primary label EN" name="primary_cta_label_en" onChange={updateField} value={form.primary_cta_label_en} />
          <TextInput label="Primary label VI" name="primary_cta_label_vi" onChange={updateField} value={form.primary_cta_label_vi} />
          <TextInput label="Primary href" name="primary_cta_href" onChange={updateField} value={form.primary_cta_href} />
          <TextInput label="Secondary label EN" name="secondary_cta_label_en" onChange={updateField} value={form.secondary_cta_label_en} />
          <TextInput label="Secondary label VI" name="secondary_cta_label_vi" onChange={updateField} value={form.secondary_cta_label_vi} />
          <TextInput label="Secondary href" name="secondary_cta_href" onChange={updateField} value={form.secondary_cta_href} />
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-950">Stats</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4" key={index}>
              <TextInput label={`Value ${index}`} name={`stat_${index}_value` as keyof HomepageFormState} onChange={updateField} value={form[`stat_${index}_value` as keyof HomepageFormState] as string} />
              <TextInput label={`Label ${index} EN`} name={`stat_${index}_label_en` as keyof HomepageFormState} onChange={updateField} value={form[`stat_${index}_label_en` as keyof HomepageFormState] as string} />
              <TextInput label={`Label ${index} VI`} name={`stat_${index}_label_vi` as keyof HomepageFormState} onChange={updateField} value={form[`stat_${index}_label_vi` as keyof HomepageFormState] as string} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-950">Section Headers</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextInput label="Articles eyebrow EN" name="articles_eyebrow_en" onChange={updateField} value={form.articles_eyebrow_en} />
          <TextInput label="Articles eyebrow VI" name="articles_eyebrow_vi" onChange={updateField} value={form.articles_eyebrow_vi} />
          <TextInput label="Articles title EN" name="articles_title_en" onChange={updateField} value={form.articles_title_en} />
          <TextInput label="Articles title VI" name="articles_title_vi" onChange={updateField} value={form.articles_title_vi} />
          <TextInput label="Events eyebrow EN" name="events_eyebrow_en" onChange={updateField} value={form.events_eyebrow_en} />
          <TextInput label="Events eyebrow VI" name="events_eyebrow_vi" onChange={updateField} value={form.events_eyebrow_vi} />
          <TextInput label="Events title EN" name="events_title_en" onChange={updateField} value={form.events_title_en} />
          <TextInput label="Events title VI" name="events_title_vi" onChange={updateField} value={form.events_title_vi} />
          <TextInput label="Courses eyebrow EN" name="courses_eyebrow_en" onChange={updateField} value={form.courses_eyebrow_en} />
          <TextInput label="Courses eyebrow VI" name="courses_eyebrow_vi" onChange={updateField} value={form.courses_eyebrow_vi} />
          <TextInput label="Courses title EN" name="courses_title_en" onChange={updateField} value={form.courses_title_en} />
          <TextInput label="Courses title VI" name="courses_title_vi" onChange={updateField} value={form.courses_title_vi} />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-600">{message ?? "Editing fixed homepage blocks"}</p>
        <Button isLoading={updateHomepage.isPending} type="submit">
          <Save aria-hidden="true" className="mr-2 h-4 w-4" />
          Save Homepage
        </Button>
      </div>
    </form>
  );
}

function TextInput<K extends keyof HomepageFormState>({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: K;
  onChange: (field: K, value: HomepageFormState[K]) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <Input onChange={(event) => onChange(name, event.target.value as HomepageFormState[K])} value={value} />
    </label>
  );
}

function TextAreaInput<K extends keyof HomepageFormState>({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: K;
  onChange: (field: K, value: HomepageFormState[K]) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <Textarea onChange={(event) => onChange(name, event.target.value as HomepageFormState[K])} value={value} />
    </label>
  );
}
