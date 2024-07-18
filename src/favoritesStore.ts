import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Entry } from "./api";

interface TagUsageState {
  favorites: Set<string>;
  filter(entries: Entry[]): Entry[];
  toggleFavorite(entryId: string): void;
}

/**
 * Keeps track of which entries are favorited
 */
export const useFavoritesStore = create(
  persist<TagUsageState>(
    (set, get) => ({
      favorites: new Set(),
      filter(entries) {
        const { favorites } = get();
        return entries.filter((entry) => favorites.has(entry.id));
      },
      toggleFavorite(entryId: string) {
        set(({ favorites }) => {
          const newFavorites = new Set(favorites);

          if (favorites.has(entryId)) {
            newFavorites.delete(entryId);
          } else {
            newFavorites.add(entryId);
          }

          return {
            favorites: newFavorites,
          };
        });
      },
    }),
    {
      name: "favorites-store",
      version: 0,
      storage: createJSONStorage(() => localStorage, {
        replacer: (key, value) => {
          if (key !== "favorites") {
            return value;
          }

          return [...(value as Set<unknown>)];
        },
        reviver: (key, value) => {
          if (key !== "favorites") {
            return value;
          }

          return new Set(value as unknown[]);
        },
      }),
    },
  ),
);
