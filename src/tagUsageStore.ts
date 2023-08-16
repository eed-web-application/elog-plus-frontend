import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Tag } from "./api";

interface TagUsageState {
  lastUsed: Record<string, Date>;
  sortByMostRecent(tags: Tag[]): Tag[];
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
          if (!lastUsed[a.id] && !lastUsed[b.id]) {
            return a.name.localeCompare(b.name);
          }
          if (lastUsed[a.id] && !lastUsed[b.id]) {
            return -1;
          }
          if (!lastUsed[a.id] && lastUsed[b.id]) {
            return 1;
          }

          return lastUsed[b.id].getTime() - lastUsed[a.id].getTime();
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
