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

export type Filters = Pick<
  EntryQuery,
  "logbooks" | "tags" | "startDate" | "endDate" | "sortByLogDate"
>;

export interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function Filters({ filters, setFilters }: Props) {
  const [isLogbooksOpen, setIsLogbooksOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const logbooks = useLogbooks({ enabled: isLogbooksOpen });
  const { tags, bumpTag } = useTags({
    logbooks: filters.logbooks,
    enabled: isTagsOpen,
  });

  const logbookFilterLabel = useCallback(() => {
    if (filters.logbooks.length === 0) {
      return "Logbook";
    }

    let out = filters.logbooks[0].toUpperCase();
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
        onOpen={() => setIsLogbooksOpen(true)}
        onClose={() => setIsLogbooksOpen(false)}
      >
        <MultiSelectMenu
          selected={filters.logbooks.map((name) => name.toUpperCase())}
          setSelected={(selected) =>
            setFilters({
              ...filters,
              logbooks: selected.map((name) => name.toLowerCase()),
            })
          }
          isLoading={logbooks === null}
          options={(logbooks || []).map(({ name }) => name.toUpperCase())}
        />
      </FilterChipWithMenu>
      <FilterChipWithMenu
        className="mr-3 mt-2"
        label={tagFilterLabel()}
        enabled={filters.tags.length !== 0}
        onOpen={() => setIsTagsOpen(true)}
        onClose={() => setIsTagsOpen(false)}
        onDisable={() => setFilters({ ...filters, tags: [] })}
      >
        <MultiSelectMenu
          selected={filters.tags}
          setSelected={(selected) => setFilters({ ...filters, tags: selected })}
          onOptionSelected={bumpTag}
          isLoading={tags === null}
          options={tags || []}
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
