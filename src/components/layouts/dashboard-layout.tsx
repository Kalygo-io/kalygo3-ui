"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import { navigation } from "@/config/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logoutRequest } from "@/services/logoutRequest";
import { useChatSessions } from "@/shared/hooks/use-chat-sessions";
import { ChatSession } from "@/services/chatSessionService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  AGENTIC_RAG_CHAT_APP_ID,
  AI_SCHOOL_AGENT_CHAT_APP_ID,
  PERSISTENT_MEMORY_CHAT_APP_ID,
  REACT_CHAT_APP_ID,
  JWT_AGENT_CHAT_APP_ID,
  KALYGO_AGENT_CHAT_APP_ID,
} from "@/ts/types/ChatAppIds";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  // Handle current session deletion
  const currentSessionId = searchParams.get("session");
  const handleCurrentSessionDeleted = useCallback(() => {
    if (currentSessionId && pathname.includes("/dashboard/")) {
      router.push("/dashboard/tokenizers");
    }
  }, [currentSessionId, pathname, router]);
  const { sessions, deleteSession, loading } = useChatSessions(
    handleCurrentSessionDeleted,
  );

  const userNavigation = [
    {
      name: "Sign out",
      onClick: async () => {
        await logoutRequest();
        setSidebarOpen(false);
        router.push("/");
      },
    },
  ];

  const segments = pathname.split("/");
  const current = segments[segments.length - 1];

  // Initialize expanded sections based on current path
  useEffect(() => {
    const newExpanded = new Set<string>();
    navigation.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some(
          (child) => child.href && pathname.startsWith(child.href),
        );
        if (isActive) {
          newExpanded.add(item.name);
        }
      }
    });
    setExpandedSections(newExpanded);
  }, [pathname]);

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const handleSessionClick = (session: ChatSession) => {
    if (session.chatAppId === PERSISTENT_MEMORY_CHAT_APP_ID) {
      router.push(`/dashboard/persistent-memory?session=${session.sessionId}`);
      setSidebarOpen(false);
    } else if (session.chatAppId === REACT_CHAT_APP_ID) {
      router.push(`/dashboard/re-act?session=${session.sessionId}`);
      setSidebarOpen(false);
    } else if (session.chatAppId === AGENTIC_RAG_CHAT_APP_ID) {
      router.push(`/dashboard/agentic-rag?session=${session.sessionId}`);
      setSidebarOpen(false);
    } else if (session.chatAppId === AI_SCHOOL_AGENT_CHAT_APP_ID) {
      router.push(`/dashboard/ai-school-agent?session=${session.sessionId}`);
      setSidebarOpen(false);
    } else if (session.chatAppId === JWT_AGENT_CHAT_APP_ID) {
      router.push(`/dashboard/jwt-agent?session=${session.sessionId}`);
      setSidebarOpen(false);
    } else if (session.agentId !== null) {
      // Sessions with an agent - navigate to agent chat with agent_id
      router.push(
        `/dashboard/agent-chat?agent_id=${session.agentId}&session=${session.sessionId}`,
      );
      setSidebarOpen(false);
    } else if (
      session.chatAppId === KALYGO_AGENT_CHAT_APP_ID ||
      session.chatAppId === "agent-chat"
    ) {
      // Handle legacy "Kalygo Agent" and "agent-chat" sessions
      router.push(`/dashboard/agent-chat?session=${session.sessionId}`);
      setSidebarOpen(false);
    } else {
      errorToast(`Session ${session.chatAppId} is not supported yet`);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  // Sub-menu section type definitions
  type SubMenuSection = {
    title: string;
    type: "sessions";
    sessions: ChatSession[];
  };

  // Determine which sub-menu sections to show based on current pathname
  // Returns an array to support multiple sections separated by dividers
  const getSubMenuSections = (): SubMenuSection[] => {
    const sections: SubMenuSection[] = [];

    // Agent Chat page - show past sessions
    if (pathname.startsWith("/dashboard/agent-chat")) {
      // Include sessions that have an agentId (new), or legacy chatAppId values
      const agentChatSessions = sessions.filter(
        (session) =>
          session.agentId !== null || // Sessions with an agent
          session.chatAppId === KALYGO_AGENT_CHAT_APP_ID ||
          session.chatAppId === "agent-chat",
      );
      sections.push({
        title: "Past Sessions",
        type: "sessions",
        sessions: agentChatSessions,
      });
      // Future: Add more sections here, e.g.:
      // sections.push({
      //   title: "Templates",
      //   type: "templates",
      //   templates: [...]
      // });
    }

    // Add more conditions for other apps/pages as needed
    // Example for Credentials:
    // if (pathname === "/dashboard/credentials") {
    //   sections.push({
    //     title: "API Keys",
    //     type: "apiKeys",
    //     apiKeys: [...]
    //   });
    //   sections.push({
    //     title: "OAuth Tokens",
    //     type: "oauthTokens",
    //     oauthTokens: [...]
    //   });
    // }

    return sections;
  };

  const subMenuSections = getSubMenuSections();

  // debugger;

  const SidebarContent = () => (
    <div className="flex grow flex-col overflow-y-auto bg-black px-6">
      {/* Logo Section */}
      <div className="py-6">
        <div
          className="flex h-8 shrink-0 items-center cursor-pointer"
          onClick={() => {
            router.push("/");
          }}
        >
          🔵
        </div>
      </div>

      {/* Divider after logo */}
      <div className="border-t border-gray-700 mb-6"></div>

      {/* Navigation Sections */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col">
          {/* Navigation Section */}
          <li className="mb-6">
            <div className="text-xs font-semibold leading-6 text-gray-400 mb-3 uppercase tracking-wider">
              Menu
            </div>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    // Parent item with children (expandable)
                    <div>
                      <button
                        onClick={() => toggleSection(item.name)}
                        className={classNames(
                          "w-full group flex items-center justify-between gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold cursor-pointer transition-colors duration-150",
                          expandedSections.has(item.name)
                            ? "text-white bg-blue-700"
                            : "text-blue-200 hover:text-white hover:bg-blue-700",
                        )}
                      >
                        <span>{item.name}</span>
                        <ChevronRightIcon
                          className={classNames(
                            "h-4 w-4 transition-transform duration-200",
                            expandedSections.has(item.name) ? "rotate-90" : "",
                          )}
                        />
                      </button>
                      {expandedSections.has(item.name) && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.name}>
                              {child.enabled ? (
                                <span
                                  onClick={() => {
                                    if (child.href) {
                                      router.push(child.href);
                                      setSidebarOpen(false);
                                    }
                                  }}
                                  className={classNames(
                                    child.href && pathname === child.href
                                      ? "bg-blue-700 text-white"
                                      : "text-blue-200 hover:text-white hover:bg-blue-700",
                                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium cursor-pointer transition-colors duration-150",
                                  )}
                                >
                                  {child.name}
                                </span>
                              ) : (
                                <span className="text-gray-500 cursor-default group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium">
                                  {child.name}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : // Single item without children
                  item.enabled ? (
                    <span
                      onClick={() => {
                        if (item.href) {
                          router.push(item.href);
                          setSidebarOpen(false);
                        }
                      }}
                      className={classNames(
                        item.href &&
                          item.href.split("/")[
                            item.href.split("/").length - 1
                          ] === current
                          ? "bg-blue-700 text-white"
                          : "text-blue-200 hover:text-white hover:bg-blue-700",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold cursor-pointer transition-colors duration-150",
                      )}
                    >
                      {item.name}
                    </span>
                  ) : (
                    <span className="text-gray-500 cursor-default group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold">
                      {item.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>

          {/* Divider between Menu and Sub Menu */}
          {subMenuSections.length > 0 && (
            <div className="border-t border-gray-700 mb-6"></div>
          )}

          {/* Sub Menu Sections - Context-aware based on selected menu option */}
          {subMenuSections.length > 0 &&
            subMenuSections.map((section, sectionIndex) => (
              <li key={`submenu-${sectionIndex}`} className="mb-6">
                {/* Divider between sub-menu sections (not before first section) */}
                {sectionIndex > 0 && (
                  <div className="border-t border-gray-700 mb-6"></div>
                )}

                {/* Sub-menu section title - dynamic based on menu option */}
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-3 uppercase tracking-wider">
                  {section.title}
                </div>

                {/* Sub-menu section content */}
                {section.type === "sessions" && (
                  <ul role="list" className="-mx-2 space-y-1">
                    {loading ? (
                      <li className="text-gray-500 text-sm px-2 py-1">
                        Loading...
                      </li>
                    ) : section.sessions.length === 0 ? (
                      <li className="text-gray-500 text-sm px-2 py-1">
                        No sessions
                      </li>
                    ) : (
                      section.sessions.map((session) => (
                        <li key={session.id}>
                          <div
                            onClick={() => handleSessionClick(session)}
                            className="group flex items-center justify-between gap-x-3 rounded-md p-2 text-sm leading-6 text-blue-200 hover:text-white hover:bg-blue-700 cursor-pointer transition-colors duration-150"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {session.title ||
                                  (session.agentId
                                    ? `Agent #${session.agentId}`
                                    : null) ||
                                  session.chatAppId ||
                                  "Chat Session"}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {new Date(session.createdAt).toLocaleString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  },
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) =>
                                handleDeleteSession(e, session.sessionId)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-all duration-150 p-1 hover:bg-red-600 rounded"
                            >
                              <TrashIcon className="h-4 w-4 text-red-400 hover:text-red-200" />
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            ))}
        </ul>

        {/* Divider before bottom actions */}
        <div className="border-t border-gray-700 mb-6"></div>

        {/* Sign Out Section */}
        <div className="pb-6">
          <ul className="space-y-1">
            <li>
              <span
                onClick={async () => {
                  await logoutRequest();
                  router.push("/");
                }}
                className={classNames(
                  "cursor-pointer text-blue-200 hover:text-white hover:bg-blue-700",
                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-150",
                )}
              >
                <ArrowLeftStartOnRectangleIcon
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 text-blue-200 group-hover:text-white"
                />
                Sign out
              </span>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <div>
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="h-6 w-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>
              <SidebarContent />
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-gray-700">
          <SidebarContent />
        </div>

        <div className="lg:pl-72">
          <div
            id="dashboard-sticky-top-nav"
            className="sticky top-0 z-[60] flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-900 bg-black text-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="h-6 w-6" />
            </button>

            {/* Separator */}
            <div
              aria-hidden="true"
              className="h-6 w-px bg-gray-900/10 lg:hidden"
            />

            <div className="flex flex-1 gap-x-4 justify-end lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Profile dropdown */}
                <Menu as="div" className="relative z-[100]">
                  <MenuButton className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>
                    <span className="hidden lg:flex lg:items-center">
                      <span
                        aria-hidden="true"
                        className="ml-4 text-sm font-semibold leading-6"
                      >
                        Account
                      </span>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="ml-2 h-5 w-5 text-gray-400"
                      />
                    </span>
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-[100] mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        <span
                          onClick={item.onClick}
                          className="cursor-pointer block px-3 py-1 text-sm leading-6 text-gray-900 data-[focus]:bg-gray-50"
                        >
                          {item.name}
                        </span>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div>{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
