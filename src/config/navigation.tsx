export interface NavigationItem {
  name: string;
  href?: string;
  enabled: boolean;
  children?: NavigationItem[];
}

export const navigation: NavigationItem[] = [
  {
    name: "Home",
    href: "/dashboard/home",
    enabled: true,
  },
  {
    name: "Apps",
    enabled: true,
    children: [
      {
        name: "View All",
        href: "/dashboard/apps",
        enabled: true,
      },
      {
        name: "Kalygo Agent",
        href: "/dashboard/kalygo-agent",
        enabled: true,
      },
    ],
  },
  {
    name: "Credentials",
    enabled: true,
    children: [
      {
        name: "View All",
        href: "/dashboard/credentials",
        enabled: true,
      },
    ],
  },
  {
    name: "Settings",
    enabled: true,
    children: [
      {
        name: "Account Settings",
        href: "/dashboard/settings/account",
        enabled: true,
      },
      {
        name: "Payment Settings",
        href: "/dashboard/settings/payment",
        enabled: false,
      },
      {
        name: "Experimental Settings",
        href: "/dashboard/settings/experimental",
        enabled: false,
      },
    ],
  },
];
