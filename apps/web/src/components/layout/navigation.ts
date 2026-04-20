export type NavItem = {
  label: string;
  href: string;
  description: string;
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    description: "Tong quan nen tang",
  },
  {
    label: "Auth",
    href: "/auth",
    description: "Dang nhap va tai khoan",
  },
  {
    label: "Members",
    href: "/member",
    description: "Ho so thanh vien",
  },
  {
    label: "Blog",
    href: "/blog",
    description: "Bai viet va noi dung",
  },
  {
    label: "Courses",
    href: "/course",
    description: "Hanh trinh hoc tap",
  },
  {
    label: "Events",
    href: "/event",
    description: "Lich sinh hoat",
  },
  {
    label: "Notifications",
    href: "/notification",
    description: "Thong bao quan trong",
  },
  {
    label: "Prayer Journal",
    href: "/prayer-journal",
    description: "Nhat ky dong hanh",
  },
];

export function getActiveNavItem(pathname: string) {
  return (
    navItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? navItems[0]
  );
}
