"use client";

import { Fragment, ReactNode } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";

export interface HierarchicalDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional: height offset from top (e.g. for sticky nav). Drawer is positioned below this. */
  topOffset?: number;
}

export function HierarchicalDrawer({
  open,
  onClose,
  children,
  topOffset = 64,
}: HierarchicalDrawerProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel
                  className="pointer-events-auto w-screen max-w-md"
                  style={{
                    top: topOffset,
                    height: `calc(100vh - ${topOffset}px)`,
                  }}
                >
                  <div className="flex h-full flex-col bg-gray-900 border-l border-gray-700 shadow-xl">
                    {children}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
