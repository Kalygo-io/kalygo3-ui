export type ChatAccent = "blue" | "purple";

/**
 * The small set of color classes that differ between the agent-chat (blue/gray)
 * and tts-chat (purple) variants of the shared chat components. Default accent
 * is "blue" so agent-chat behavior is unchanged.
 */
export interface ChatAccentClasses {
  /** error-details-drawer "What to do next" help box */
  helpBoxBg: string;
  helpBoxBorder: string;
  helpTitle: string;
  /** chat-message AI bubble border */
  aiBorder: string;
  /** chat-message "Tool Calls & References" button */
  toolButtonBg: string;
  toolButtonIcon: string;
  /** chat-message separator gradient */
  separator: string;
}

const ACCENTS: Record<ChatAccent, ChatAccentClasses> = {
  blue: {
    helpBoxBg: "bg-blue-900/20",
    helpBoxBorder: "border-blue-700/30",
    helpTitle: "text-blue-400",
    aiBorder: "border-gray-700/50",
    toolButtonBg:
      "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50",
    toolButtonIcon: "text-blue-400",
    separator: "bg-gradient-to-r from-transparent via-gray-600/30 to-transparent",
  },
  purple: {
    helpBoxBg: "bg-purple-900/20",
    helpBoxBorder: "border-purple-700/30",
    helpTitle: "text-purple-400",
    aiBorder: "border-purple-700/30",
    toolButtonBg:
      "bg-purple-900/20 hover:bg-purple-900/30 border border-purple-600/50",
    toolButtonIcon: "text-purple-400",
    separator:
      "bg-gradient-to-r from-transparent via-purple-600/30 to-transparent",
  },
};

export function getAccentClasses(accent: ChatAccent = "blue"): ChatAccentClasses {
  return ACCENTS[accent];
}
