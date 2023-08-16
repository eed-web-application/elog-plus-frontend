import { useCallback, useState } from "react";
import { EntryQuery } from "../hooks/useEntries";
import FilterChip from "./FilterChip.tsx";
import MultiSelectMenu from "./MultiSelectMenu.tsx";
import { Input } from "./base.ts";
import Chip from "./Chip.tsx";
import FilterChipWithMenu from "./FilterChipWithMenu.tsx";
import useLogbooks from "../hooks/useLogbooks.ts";
import useTags from "../hooks/useTags.ts";
import { yyyymmddToDate, dateToYYYYMMDD } from "../utils/datetimeConversion.ts";
import { Tag } from "../api/tags.ts";
import { Logbook } from "../api/logbooks.ts";

export type Filters = Pick<
  EntryQuery,
  "logbooks" | "tags" | "startDate" | "endDate" | "sortByLogDate"
>;

function extractTagLabel(tag: Tag) {
  return tag.name;
}
function extractLogbookLabel(logbook: Logbook) {
  return logbook.name.toUpperCase();
}
function extractKey(tagOrLogbook: Tag | Logbook) {
  return tagOrLogbook.id;
}

export interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function Filters({ filters, setFilters }: Props) {
  const logbooks = useLogbooks();
  const { tags, bumpTag } = useTags({
    logbooks: filters.logbooks,
  });

  const logbookFilterLabel = useCallback(() => {
    const firstSelectedId = filters.logbooks[0];

    if (!firstSelectedId || !logbooks) {
      return "Logbook";
    }

    const firstLogbook = logbooks.find(({ id }) => id === firstSelectedId);

    let label = firstLogbook?.name.toUpperCase();

    if (filters.logbooks.length > 1) {
      label += ` and ${filters.logbooks.length - 1} other`;
      if (filters.logbooks.length > 2) {
        label += "s";
      }
    }

    return label;
  }, [filters.logbooks, logbooks]);

  const tagFilterLabel = useCallback(() => {
    const firstSelectedId = filters.tags[0];

    console.log(firstSelectedId);
    console.log(tags);
    if (!firstSelectedId || !tags) {
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
          {filters.tags?.slice(0, 2).map((tagId, index) => {
            const tag = tags.find(({ id }) => id === tagId);

            if (!tag) {
              return;
            }

            return (
              <Chip
                key={tag.id}
                className={
                  (index !== 1 && index !== filters.tags.length - 1) ||
                  andOtherText
                    ? "mr-1"
                    : ""
                }
              >
                {tag.name}
              </Chip>
            );
          })}
          {andOtherText}
        </div>
      </>
    );
  }, [filters.tags, tags]);

  return (
    <div className="flex flex-wrap">
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={logbookFilterLabel()}
        enabled={filters.logbooks.length !== 0 && Boolean(logbooks)}
        onDisable={() => setFilters({ ...filters, logbooks: [] })}
      >
        <MultiSelectMenu
          selected={filters.logbooks}
          setSelected={(selected) =>
            setFilters({
              ...filters,
              logbooks: selected,
            })
          }
          isLoading={logbooks === null}
          options={logbooks || []}
          extractLabel={extractLogbookLabel}
          extractKey={extractKey}
        />
      </FilterChipWithMenu>
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={tagFilterLabel()}
        enabled={filters.tags.length !== 0 && Boolean(tags)}
        onDisable={() => setFilters({ ...filters, tags: [] })}
      >
        <MultiSelectMenu
          selected={filters.tags}
          setSelected={(selected) => setFilters({ ...filters, tags: selected })}
          onOptionSelected={bumpTag}
          isLoading={tags === null}
          options={tags}
          extractLabel={extractTagLabel}
          extractKey={extractKey}
        />
      </FilterChipWithMenu>
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={
          filters.startDate
            ? filters.startDate.toLocaleDateString("en-us", {
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
          value={filters.startDate ? dateToYYYYMMDD(filters.startDate) : ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              startDate: yyyymmddToDate(e.target.value),
            })
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
          value={filters.endDate ? dateToYYYYMMDD(filters.endDate) : ""}
          onChange={(e) =>
            setFilters({ ...filters, endDate: yyyymmddToDate(e.target.value) })
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
