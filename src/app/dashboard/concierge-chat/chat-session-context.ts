"use client";

import { createContext } from "react";
import { Action, initialState } from "./chat-session-reducer";

export const ChatContext = createContext(initialState);

export const ChatDispatchContext = createContext<React.Dispatch<Action> | null>(
  null
);
