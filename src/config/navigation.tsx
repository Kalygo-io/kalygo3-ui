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
    name: "Prompts",
    href: "/dashboard/prompts",
    enabled: true,
  },
  {
    name: "Agent Chat",
    href: "/dashboard/agent-chat",
    enabled: true,
  },
  {
    name: "TTS Chat",
    href: "/dashboard/tts-chat",
    enabled: true,
  },
  {
    name: "Vector Stores",
    href: "/dashboard/vector-stores",
    enabled: true,
  },
  {
    name: "Access Groups",
    href: "/dashboard/groups",
    enabled: true,
  },
  {
    name: "Credentials",
    href: "/dashboard/credentials",
    enabled: true,
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
        name: "App Settings",
        href: "/dashboard/settings/app-settings",
        enabled: true,
      },
      {
        name: "API Keys",
        href: "/dashboard/settings/api-keys",
        enabled: true,
      },
    ],
  },
];
