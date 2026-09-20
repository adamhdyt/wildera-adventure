"use client"

import { createContext, useContext } from "react"

export const EntranceContext = createContext(true)
export const useEntranceReady = () => useContext(EntranceContext)
