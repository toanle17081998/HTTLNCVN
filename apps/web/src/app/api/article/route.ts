import { NextResponse } from "next/server";

type ArticlePayload = {
  title?: unknown;
  excerpt?: unknown;
  category?: unknown;
  tags?: unknown;
  contentHtml?: unknown;
  contentText?: unknown;
};

export async function POST(request: Request) {
  let payload: ArticlePayload;

  try {
    payload = (await request.json()) as ArticlePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (typeof payload.title !== "string" || payload.title.trim().length === 0) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 },
    );
  }

  if (
    typeof payload.contentHtml !== "string" ||
    payload.contentHtml.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Content is required." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      article: {
        id: crypto.randomUUID(),
        title: payload.title.trim(),
        excerpt: typeof payload.excerpt === "string" ? payload.excerpt.trim() : "",
        category:
          typeof payload.category === "string" ? payload.category.trim() : "",
        tags: Array.isArray(payload.tags)
          ? payload.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        contentHtml: payload.contentHtml,
        contentText:
          typeof payload.contentText === "string" ? payload.contentText : "",
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 },
  );
}
