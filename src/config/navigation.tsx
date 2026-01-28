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
    name: "Agents",
    href: "/dashboard/agents",
    enabled: true,
  },
  {
    name: "Playground",
    enabled: true,
    children: [
      {
        name: "View All",
        href: "/dashboard/apps",
        enabled: true,
      },
      {
        name: "Agent Chat",
        href: "/dashboard/agent-chat",
        enabled: true,
      },
      {
        name: "Concierge Chat",
        href: "/dashboard/concierge-chat",
        enabled: true,
      },
      {
        name: "Vector Stores",
        href: "/dashboard/vector-stores",
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
        name: "API Keys",
        href: "/dashboard/settings/api-keys",
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
