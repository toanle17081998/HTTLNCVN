"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pageApi, pageKeys } from "./page";

export type HeaderNavItem = {
  descriptionEn?: string;
  descriptionVi?: string;
  href: string;
  icon?: string;
  id: string;
  labelEn: string;
  labelVi: string;
  visible: boolean;
};

export type HeaderCtaConfig = {
  enabled: boolean;
  href: string;
  labelEn: string;
  labelVi: string;
};

export type FooterContactItem = {
  href?: string;
  icon: string;
  id: string;
  labelEn: string;
  labelVi: string;
  valueEn: string;
  valueVi: string;
};

export type FooterLinkItem = {
  href: string;
  id: string;
  labelEn: string;
  labelVi: string;
};

export type PageHeroConfig = {
  coverImage?: string;
  descriptionEn?: string;
  descriptionVi?: string;
  eyebrowEn?: string;
  eyebrowVi?: string;
  titleEn?: string;
  titleVi?: string;
};

export type SiteNavigationConfig = {
  footer: {
    appName?: string;
    communityTitle?: string;
    contacts: FooterContactItem[];
    copyrightTextEn?: string;
    copyrightTextVi?: string;
    descriptionEn?: string;
    descriptionVi?: string;
    links: FooterLinkItem[];
    tagline?: string;
  };
  header: {
    brandName?: string;
    cta: HeaderCtaConfig;
    items: HeaderNavItem[];
    tagline?: string;
  };
  pageHeroes: Record<string, PageHeroConfig>;
};

export const SITE_NAVIGATION_SLUG = "site-navigation";

export const defaultPageHeroes: Record<string, PageHeroConfig> = {
  "/article": {
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=85",
    descriptionEn: "Read spiritual insights, devotions, and community updates.",
    descriptionVi: "Đọc các bài chia sẻ Lời Chúa, tâm linh và tin tức từ cộng đồng hội thánh.",
    eyebrowEn: "Articles",
    eyebrowVi: "Bài viết",
    titleEn: "Articles & News",
    titleVi: "Bài viết & Tin tức",
  },
  "/course": {
    coverImage: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1400&q=85",
    descriptionEn: "Explore Bible studies, foundational doctrine, and discipleship training.",
    descriptionVi: "Các lớp học Kinh Thánh, giáo lý căn bản và chương trình đào tạo môn đồ.",
    eyebrowEn: "Courses",
    eyebrowVi: "Khóa học",
    titleEn: "Learning Tracks",
    titleVi: "Chương trình Học tập",
  },
  "/event": {
    coverImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85",
    descriptionEn: "Stay connected with upcoming worship services, fellowships, and ministry events.",
    descriptionVi: "Theo dõi các buổi nhóm thờ phượng, thông công và hoạt động mục vụ sắp tới.",
    eyebrowEn: "Events",
    eyebrowVi: "Sự kiện",
    titleEn: "Events & Gatherings",
    titleVi: "Lịch Sinh hoạt & Sự kiện",
  },
  "/church": {
    coverImage: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85",
    descriptionEn: "Discover our departments, cell groups, and serving teams.",
    descriptionVi: "Thông tin về các ban ngành, nhóm tế bào và nhân sự phục vụ tại Hội thánh.",
    eyebrowEn: "Church",
    eyebrowVi: "Hội thánh",
    titleEn: "Church Units & Departments",
    titleVi: "Hội Thánh & Ban ngành",
  },
  "/prayer-journal": {
    coverImage: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=85",
    descriptionEn: "Track personal requests, mark answered prayers, and share selected needs with the church.",
    descriptionVi: "Theo dõi lời cầu nguyện cá nhân, đánh dấu khi được nhậm và chia sẻ nhu cầu với hội thánh.",
    eyebrowEn: "Prayer",
    eyebrowVi: "Cầu nguyện",
    titleEn: "Prayer Journal",
    titleVi: "Sổ Cầu Nguyện",
  },
  "/about": {
    coverImage: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1400&q=85",
    descriptionEn: "Our history, vision, faith confession, and mission.",
    descriptionVi: "Lịch sử hình thành, khải tượng, niềm tin và sứ mệnh phục vụ cộng đồng.",
    eyebrowEn: "About",
    eyebrowVi: "Giới thiệu",
    titleEn: "About Our Church",
    titleVi: "Về Hội Thánh",
  },
};

export const defaultSiteNavigationConfig: SiteNavigationConfig = {
  header: {
    brandName: "HTNC",
    tagline: "Hội Thánh Tin Lành",
    cta: {
      enabled: false,
      href: "/contact",
      labelEn: "Plan a Visit",
      labelVi: "Ghé thăm",
    },
    items: [
      {
        descriptionEn: "Church background and vision",
        descriptionVi: "Lịch sử và khải tượng hội thánh",
        href: "/about",
        icon: "info",
        id: "nav-about",
        labelEn: "About",
        labelVi: "Giới thiệu",
        visible: true,
      },
      {
        descriptionEn: "Featured articles and community news",
        descriptionVi: "Bài viết và tin tức cộng đồng",
        href: "/article",
        icon: "bible",
        id: "nav-article",
        labelEn: "Articles",
        labelVi: "Bài viết",
        visible: true,
      },
      {
        descriptionEn: "Bible classes and discipleship tracks",
        descriptionVi: "Các khóa học Kinh Thánh và môn đồ hóa",
        href: "/course",
        icon: "education",
        id: "nav-course",
        labelEn: "Courses",
        labelVi: "Khóa học",
        visible: true,
      },
      {
        descriptionEn: "Upcoming gatherings and service times",
        descriptionVi: "Lịch sinh hoạt và thờ phượng",
        href: "/event",
        icon: "calendar",
        id: "nav-event",
        labelEn: "Events",
        labelVi: "Sự kiện",
        visible: true,
      },
      {
        descriptionEn: "Church structure and departments",
        descriptionVi: "Cơ cấu và các ban ngành hội thánh",
        href: "/church",
        icon: "church",
        id: "nav-church",
        labelEn: "Church",
        labelVi: "Hội thánh",
        visible: true,
      },
      {
        descriptionEn: "Personal prayers and community requests",
        descriptionVi: "Sổ cầu nguyện cá nhân và cộng đồng",
        href: "/prayer-journal",
        icon: "prayer",
        id: "nav-prayer",
        labelEn: "Prayer Journal",
        labelVi: "Cầu nguyện",
        visible: true,
      },
    ],
  },
  footer: {
    appName: "HTNC Platform",
    communityTitle: "Cộng đồng đức tin",
    copyrightTextEn: "All rights reserved.",
    copyrightTextVi: "Mọi quyền được bảo lưu.",
    descriptionEn: "A welcoming Christian community committed to worship, discipleship, and fellowship.",
    descriptionVi: "Cộng đồng Cơ Đốc gắn kết, cùng nhau thờ phượng Chúa, học Lời Ngài và gây dựng đức tin.",
    tagline: "Học hỏi và gây dựng cộng đồng",
    contacts: [
      {
        href: "mailto:hello@httlncvn.local",
        icon: "mail",
        id: "contact-1",
        labelEn: "General Contact",
        labelVi: "Liên hệ chung",
        valueEn: "hello@httlncvn.local",
        valueVi: "hello@httlncvn.local",
      },
      {
        href: "mailto:events@httlncvn.local",
        icon: "calendar",
        id: "contact-2",
        labelEn: "Events & Gatherings",
        labelVi: "Sự kiện & Lịch sinh hoạt",
        valueEn: "events@httlncvn.local",
        valueVi: "events@httlncvn.local",
      },
      {
        href: undefined,
        icon: "location",
        id: "contact-3",
        labelEn: "Location",
        labelVi: "Địa điểm",
        valueEn: "Main Sanctuary & Classrooms",
        valueVi: "Nhà thờ chính & Phòng nhóm",
      },
      {
        href: undefined,
        icon: "connect",
        id: "contact-4",
        labelEn: "Community",
        labelVi: "Cộng đồng",
        valueEn: "Active fellowships and care groups",
        valueVi: "Các ban ngành và nhóm nhỏ",
      },
    ],
    links: [
      { href: "/about", id: "flink-1", labelEn: "About", labelVi: "Giới thiệu" },
      { href: "/article", id: "flink-2", labelEn: "Articles", labelVi: "Bài viết" },
      { href: "/course", id: "flink-3", labelEn: "Courses", labelVi: "Khóa học" },
      { href: "/event", id: "flink-4", labelEn: "Events", labelVi: "Sự kiện" },
      { href: "/church", id: "flink-5", labelEn: "Church Units", labelVi: "Ban ngành" },
      { href: "/privacy", id: "flink-6", labelEn: "Privacy", labelVi: "Quyền riêng tư" },
      { href: "/terms", id: "flink-7", labelEn: "Terms", labelVi: "Điều khoản" },
    ],
  },
  pageHeroes: defaultPageHeroes,
};

export function parseSiteNavigationConfig(rawString?: string): SiteNavigationConfig {
  if (!rawString) return defaultSiteNavigationConfig;
  try {
    const parsed = JSON.parse(rawString);
    return {
      header: {
        ...defaultSiteNavigationConfig.header,
        ...parsed.header,
        cta: {
          ...defaultSiteNavigationConfig.header.cta,
          ...parsed.header?.cta,
        },
        items: Array.isArray(parsed.header?.items) && parsed.header.items.length
          ? parsed.header.items
          : defaultSiteNavigationConfig.header.items,
      },
      footer: {
        ...defaultSiteNavigationConfig.footer,
        ...parsed.footer,
        contacts: Array.isArray(parsed.footer?.contacts) && parsed.footer.contacts.length
          ? parsed.footer.contacts
          : defaultSiteNavigationConfig.footer.contacts,
        links: Array.isArray(parsed.footer?.links) && parsed.footer.links.length
          ? parsed.footer.links
          : defaultSiteNavigationConfig.footer.links,
      },
      pageHeroes: {
        ...defaultPageHeroes,
        ...parsed.pageHeroes,
      },
    };
  } catch {
    return defaultSiteNavigationConfig;
  }
}

export function useSiteNavigationQuery() {
  return useQuery({
    queryFn: async () => {
      try {
        const page = await pageApi.detail(SITE_NAVIGATION_SLUG);
        if (page?.content_en || page?.content_vi) {
          return parseSiteNavigationConfig(page.content_en || page.content_vi);
        }
        return defaultSiteNavigationConfig;
      } catch {
        return defaultSiteNavigationConfig;
      }
    },
    queryKey: [...pageKeys.detail(SITE_NAVIGATION_SLUG), "site-config"],
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
}

export function useUpdateSiteNavigationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: SiteNavigationConfig) => {
      const jsonString = JSON.stringify(config);
      try {
        await pageApi.update(SITE_NAVIGATION_SLUG, {
          content_en: jsonString,
          content_vi: jsonString,
          status: "published",
        });
      } catch (err: any) {
        if (err?.status === 404 || err?.statusCode === 404) {
          await pageApi.create({
            content_en: jsonString,
            content_vi: jsonString,
            route_path: `/${SITE_NAVIGATION_SLUG}`,
            slug: SITE_NAVIGATION_SLUG,
            title_en: "Site Navigation and Footer",
            title_vi: "Menu điều hướng và Chân trang",
          });
        } else {
          throw err;
        }
      }
      return config;
    },
    onSuccess: (savedConfig) => {
      queryClient.setQueryData(
        [...pageKeys.detail(SITE_NAVIGATION_SLUG), "site-config"],
        savedConfig
      );
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(SITE_NAVIGATION_SLUG) });
    },
  });
}
