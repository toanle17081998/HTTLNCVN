import { apiRequest } from "./client";
import type { Page, UpdatePageDto } from "@/services/page";

export const pageApi = {
  resolve(path: string) {
    const search = new URLSearchParams({ path });
    return apiRequest<Page>(`/pages/resolve?${search.toString()}`);
  },
  update(slug: string, dto: UpdatePageDto) {
    return apiRequest<Page>(`/pages/${encodeURIComponent(slug)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
    });
  },
};
