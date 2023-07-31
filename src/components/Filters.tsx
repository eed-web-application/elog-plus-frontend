import { useCallback, useEffect, useState } from "react";
import { fetchLogbooks, fetchTags } from "../api";
import { EntryQuery } from "../hooks/useEntries";
import FilterChip from "./FilterChip.tsx";
import MultiSelectMenu from "./MultiSelectMenu.tsx";
import { Input } from "./base.ts";
import Chip from "./Chip.tsx";
import FilterChipWithMenu from "./FilterChipWithMenu.tsx";
import dateToDateString from "../utils/dateToDateString.ts";
import { useTagUsageStore } from "../tagUsageStore.ts";

export type Filters = Pick<
  EntryQuery,
  "logbooks" | "tags" | "startDate" | "endDate" | "sortByLogDate"
>;

export interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function Filters({ filters, setFilters }: Props) {
  const [logbooks, setLogbooks] = useState<string[] | null>(null);
  const [tagsLoaded, setTagsLoaded] = useState<Record<string, string[]>>({});
  const logbooksAsKey = filters.logbooks.join(",");
  const tags = [...new Set(tagsLoaded[logbooksAsKey])];
  const [bumpTag, sortTagsByMostRecent] = useTagUsageStore((state) => [
    state.bump,
    state.sortByMostRecent,
  ]);

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then((logbooks) =>
        setLogbooks(logbooks.map(({ name }) => name))
      );
    }
  }, [logbooks]);

  const hasTagsLoaded = logbooksAsKey in tagsLoaded;
  const loadTags = useCallback(() => {
    if (!hasTagsLoaded) {
      fetchTags({ logbooks: filters.logbooks }).then((tags) =>
        setTagsLoaded((tagsLoaded) => ({
          ...tagsLoaded,
          [logbooksAsKey]: tags,
        }))
      );
    }
  }, [logbooksAsKey, filters.logbooks, hasTagsLoaded]);

  const logbookFilterLabel = useCallback(() => {
    if (filters.logbooks.length === 0) {
      return "Logbook";
    }

    let out = filters.logbooks[0];
    if (filters.logbooks.length > 1) {
      out += ` and ${filters.logbooks.length - 1} other`;
      if (filters.logbooks.length > 2) {
        out += "s";
      }
    }

    return out;
  }, [filters.logbooks]);

  const tagFilterLabel = useCallback(() => {
    if (filters.tags.length === 0) {
      return "Tags";
    }

    let andOtherText = "";

    if (filters.tags.length > 2) {
      andOtherText += ` and ${filters.tags.length - 2} other`;
      if (filters.tags.length > 3) {
        andOtherText += "s";
      }
    }

    return (
      <>
        <div className="flex items-center">
          {filters.tags?.slice(0, 2).map((tag, index) => (
            <Chip
              key={tag}
              className={
                (index !== 1 && index !== filters.tags.length - 1) ||
                andOtherText
                  ? "mr-1"
                  : ""
              }
            >
              {tag}
            </Chip>
          ))}
          {andOtherText}
        </div>
      </>
    );
  }, [filters.tags]);

  return (
    <div className="flex flex-wrap">
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={logbookFilterLabel()}
        enabled={filters.logbooks.length !== 0}
        onDisable={() => setFilters({ ...filters, logbooks: [] })}
      >
        <MultiSelectMenu
          selected={filters.logbooks}
          setSelected={(selected) =>
            setFilters({ ...filters, logbooks: selected })
          }
          isLoading={logbooks === null}
          options={logbooks || []}
        />
      </FilterChipWithMenu>
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={tagFilterLabel()}
        enabled={filters.tags.length !== 0}
        onOpen={loadTags}
        onDisable={() => setFilters({ ...filters, tags: [] })}
      >
        <MultiSelectMenu
          selected={filters.tags}
          setSelected={(selected) => setFilters({ ...filters, tags: selected })}
          onOptionSelected={bumpTag}
          isLoading={tags === null}
          options={sortTagsByMostRecent(tags || [])}
        />
      </FilterChipWithMenu>
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={
          filters.startDate
            ? new Date(filters.startDate).toLocaleDateString("en-us", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "From"
        }
        enabled={Boolean(filters.startDate)}
        onDisable={() => setFilters({ ...filters, startDate: null })}
        inline
      >
        <input
          className={Input}
          type="date"
          autoFocus
          value={filters.startDate ? dateToDateString(filters.startDate) : ""}
          onChange={(e) =>
            setFilters({ ...filters, startDate: new Date(e.target.value) })
          }
        />
      </FilterChipWithMenu>
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={
          filters.endDate
            ? filters.endDate.toLocaleDateString("en-us", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "To"
        }
        enabled={Boolean(filters.endDate)}
        onDisable={() => setFilters({ ...filters, endDate: null })}
        inline
      >
        <input
          className={Input}
          type="date"
          autoFocus
          value={filters.endDate ? dateToDateString(filters.endDate) : ""}
          onChange={(e) =>
            setFilters({ ...filters, endDate: new Date(e.target.value) })
          }
        />
      </FilterChipWithMenu>
      <FilterChip
        className="mr-3 mt-2"
        label="Sort by log date"
        enabled={filters.sortByLogDate}
        showCheck
        onClick={() =>
          setFilters({ ...filters, sortByLogDate: !filters.sortByLogDate })
        }
      />
    </div>
  );
}
