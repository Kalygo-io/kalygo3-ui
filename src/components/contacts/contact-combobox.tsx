"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { contactsService, Contact } from "@/services/contactsService";

interface ContactComboboxProps {
  /** Currently linked contact id, or null when unlinked. */
  value: number | null;
  /** Display name for the linked contact (so we can show it without refetching). */
  displayName?: string | null;
  /** Fired with the picked contact (or null when cleared). */
  onChange: (contactId: number | null, contactName: string | null) => void;
  placeholder?: string;
}

/**
 * Searchable contact picker. Closed state shows the linked contact (with a
 * clear button); open state is a debounced server-side search over contacts.
 */
export function ContactCombobox({
  value,
  displayName,
  onChange,
  placeholder = "Search contacts…",
}: ContactComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click.
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Debounced search whenever the dropdown is open and the query changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await contactsService.listContactsPage({
          search: query.trim() || undefined,
          limit: 10,
        });
        if (!cancelled) {
          setResults(res.contacts);
          setActiveIdx(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const select = (c: Contact) => {
    onChange(c.id, c.name);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    onChange(null, null);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIdx]) select(results[activeIdx]);
    }
  };

  const linked = value != null;

  return (
    <div className="relative" ref={rootRef}>
      {linked && !open ? (
        // Closed + linked: show the contact with a clear button.
        <div className="flex items-center justify-between gap-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="min-w-0 flex-1 text-left text-white truncate"
            title="Change contact"
          >
            {displayName || `Contact #${value}`}
          </button>
          <button
            type="button"
            onClick={clear}
            className="text-gray-400 hover:text-red-400 flex-shrink-0"
            title="Unlink contact"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      )}

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No contacts found
            </div>
          ) : (
            results.map((c, i) => (
              <button
                type="button"
                key={c.id}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => select(c)}
                className={`w-full text-left px-3 py-2 transition-colors ${
                  i === activeIdx ? "bg-gray-700" : "hover:bg-gray-700/60"
                } ${c.id === value ? "ring-1 ring-inset ring-blue-500/40" : ""}`}
              >
                <p className="text-white text-sm truncate">{c.name}</p>
                <p className="text-gray-400 text-xs truncate">{c.email}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
