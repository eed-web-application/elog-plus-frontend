import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TagUsageState {
  lastUsed: Record<string, Date>;
  sortByMostRecent(tags: string[]): string[];
  bump(tag: string): void;
}

/**
 * Manages informatin about when each tag was last used for
 * the purpose of most recent tag sorting.
 */
export const useTagUsageStore = create(
  persist<TagUsageState>(
    (set, get) => ({
      lastUsed: {},
      sortByMostRecent(tags) {
        const { lastUsed } = get();

        const sortedTags = [...tags];
        sortedTags.sort((a, b) => {
          if (!lastUsed[a] && !lastUsed[b]) {
            return a.localeCompare(b);
          }
          if (lastUsed[a] && !lastUsed[b]) {
            return -1;
          }
          if (!lastUsed[a] && lastUsed[b]) {
            return 1;
          }

          return lastUsed[b].getTime() - lastUsed[a].getTime();
        });

        return sortedTags;
      },
      bump(tag) {
        set(({ lastUsed }) => ({
          lastUsed: { ...lastUsed, [tag]: new Date() },
        }));
      },
    }),
    {
      name: "tag-usage-store",
      version: 0,
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key !== "lastUsed") {
            return value;
          }

          return Object.fromEntries(
            Object.entries(value as Record<string, string>).map(
              ([tag, lastUsed]) => [tag, new Date(lastUsed)]
            )
          );
        },
      }),
    }
  )
);
