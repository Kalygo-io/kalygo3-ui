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
    name: "Contacts",
    href: "/dashboard/contacts",
    enabled: true,
  },
  {
    name: "Contact Lists",
    href: "/dashboard/contact-lists",
    enabled: true,
  },
  {
    name: "Companies",
    href: "/dashboard/companies",
    enabled: true,
  },
  {
    name: "Deals",
    href: "/dashboard/deals",
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
    name: "Knowledge Bases",
    enabled: true,
    children: [
      {
        name: "Show All",
        href: "/dashboard/vector-stores",
        enabled: true,
      },
      {
        name: "Data Ingestion",
        href: "/dashboard/vector-stores/data-ingestion",
        enabled: true,
      },
      {
        name: "PDF to FAQ",
        href: "/dashboard/vector-stores/pdf-to-faq",
        enabled: true,
      },
    ],
  },
  {
    name: "Access",
    enabled: true,
    children: [
      {
        name: "Groups",
        href: "/dashboard/groups",
        enabled: true,
      },
      {
        name: "Audit",
        href: "/dashboard/access/audit",
        enabled: true,
      },
    ],
  },
  {
    name: "Credentials",
    href: "/dashboard/credentials",
    enabled: true,
  },
  {
    name: "Email Templates",
    href: "/dashboard/email-templates",
    enabled: true,
  },
  {
    name: "Email Campaigns",
    href: "/dashboard/email-campaigns",
    enabled: true,
  },
  {
    name: "Analytics",
    enabled: true,
    children: [
      {
        name: "SES Email Analytics",
        href: "/dashboard/analytics/ses-email",
        enabled: true,
      },
      {
        name: "Usage Analytics",
        href: "/dashboard/analytics/usage",
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
