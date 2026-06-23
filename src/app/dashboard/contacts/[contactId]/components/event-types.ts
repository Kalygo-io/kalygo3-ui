import {
  DocumentTextIcon,
  PhoneArrowUpRightIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

// ── Event type config ─────────────────────────────────────────────────────────

export const EVENT_TYPES = [
  { value: "note", label: "Note", icon: DocumentTextIcon, color: "text-gray-400" },
  { value: "call", label: "Call", icon: PhoneArrowUpRightIcon, color: "text-green-400" },
  { value: "email", label: "Email", icon: EnvelopeIcon, color: "text-blue-400" },
  { value: "meeting", label: "Meeting", icon: VideoCameraIcon, color: "text-purple-400" },
  { value: "demo", label: "Demo", icon: VideoCameraIcon, color: "text-indigo-400" },
  { value: "proposal_sent", label: "Proposal Sent", icon: PaperAirplaneIcon, color: "text-amber-400" },
  { value: "contract_signed", label: "Contract Signed", icon: CheckCircleIcon, color: "text-emerald-400" },
];

export function getEventType(value: string) {
  return EVENT_TYPES.find((t) => t.value === value) ?? {
    value,
    label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: ChatBubbleLeftEllipsisIcon,
    color: "text-gray-400",
  };
}
