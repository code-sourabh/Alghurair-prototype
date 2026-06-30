'use client';

import { createContext, useContext } from 'react';

/**
 * Element that Radix portals (Sheet, Select, …) should render into. When a
 * framed surface like the driver phone preview provides one, overlays stay
 * inside the frame instead of escaping to the full web viewport.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

/** Returns the active portal container, or `undefined` to use Radix's default (body). */
export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined;
}
