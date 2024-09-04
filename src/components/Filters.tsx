import { useCallback } from "react";
import { EntryQuery } from "../hooks/useEntries";
import FilterChip from "./FilterChip.tsx";
import { Input } from "./base.ts";
import Chip from "./Chip.tsx";
import useLogbooks from "../hooks/useLogbooks.ts";
import useTags from "../hooks/useTags.ts";
import { Tag } from "../api/tags.ts";
import FilterChipMultiSelect from "./FilterChipMultiSelect.tsx";
import FilterChipInput from "./FilterChipInput.tsx";
import { dateToYYYYMMDD, yyyymmddToDate } from "../utils/datetimeConversion.ts";

export type FilterOptions = Pick<
  EntryQuery,
  | "logbooks"
  | "tags"
  | "requireAllTags"
  | "startDate"
  | "endDate"
  | "sortByLogDate"
  | "onlyFavorites"
>;

function extractTagLabel(tag: Tag) {
  return `${tag.logbook.name.toUpperCase()}:${tag.name}`;
}
function extractTagKey(tag: Tag) {
  return tag.id;
}

export interface Props {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function Filters({ filters, onFiltersChange }: Props) {
  const {
    logbooks,
    logbookNameMap,
    isLoading: isLogbooksLoading,
  } = useLogbooks();

  const {
    tags,
    tagMap,
    bumpTag,
    isLoading: isTagsFetching,
  } = useTags({
    logbooks: isLogbooksLoading
      ? []
      : filters.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id),
    enabled: !isLogbooksLoading,
  });

  const isTagsLoading = isLogbooksLoading || isTagsFetching;

  const logbookFilterLabel = useCallback(() => {
    const firstSelectedLogbook = filters.logbooks[0];

    if (!firstSelectedLogbook || filters.onlyFavorites) {
      return "Logbook";
    }

    let label = firstSelectedLogbook.toUpperCase();

    if (filters.logbooks.length > 1) {
      label += ` and ${filters.logbooks.length - 1} other`;
      if (filters.logbooks.length > 2) {
        label += "s";
      }
    }

    return label;
  }, [filters.logbooks, filters.onlyFavorites]);

  const tagFilterLabel = useCallback(() => {
    const firstSelectedId = filters.tags[0];

    if (!firstSelectedId || isTagsLoading || filters.onlyFavorites) {
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
            const tag = tagMap[tagId];

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
                {tag.logbook.name.toUpperCase()}:{tag.name}
              </Chip>
            );
          })}
          {andOtherText}
        </div>
      </>
    );
  }, [filters.tags, filters.onlyFavorites, tagMap, isTagsLoading]);

  function setFilters(newFilters: FilterOptions) {
    if (filters.logbooks.join(",") !== newFilters.logbooks.join(",")) {
      newFilters.tags = [];
    }

    onFiltersChange(newFilters);
  }

  const favoritesLabel = useCallback(() => {
    return filters.onlyFavorites ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    );
  }, [filters.onlyFavorites]);

  return (
    <div className="flex flex-wrap">
      <FilterChipMultiSelect
        className="mt-2 mr-3"
        label={logbookFilterLabel()}
        disabled={filters.onlyFavorites}
        active={filters.logbooks.length !== 0}
        onDisable={() => setFilters({ ...filters, logbooks: [] })}
        selected={filters.logbooks}
        setSelected={(selected) =>
          setFilters({
            ...filters,
            logbooks: selected,
          })
        }
        isLoading={isLogbooksLoading}
        options={(logbooks || []).map((logbook) => logbook.name.toUpperCase())}
        extractKey={(x) => x as string}
        extractLabel={(x) => x}
      />
      <FilterChipMultiSelect
        className="mt-2 mr-3"
        label={tagFilterLabel()}
        disabled={filters.onlyFavorites}
        active={filters.tags.length !== 0 && !isTagsLoading}
        onDisable={() => setFilters({ ...filters, tags: [] })}
        selected={filters.tags}
        setSelected={(selected) => setFilters({ ...filters, tags: selected })}
        onOptionSelected={bumpTag}
        isLoading={isTagsLoading}
        options={tags}
        extractLabel={extractTagLabel}
        extractKey={extractTagKey}
        searchButton={
          <button
            type="button"
            className="flex justify-center items-center px-2 w-12 bg-gray-100 rounded-tr border border-gray-300 hover:bg-gray-200 border-l-transparent"
            onClick={() =>
              setFilters({
                ...filters,
                requireAllTags: !filters.requireAllTags,
              })
            }
          >
            {filters.requireAllTags ? "All" : "Any"}
          </button>
        }
      />
      <FilterChipInput
        className="mt-2 mr-3"
        label={
          filters.startDate && !filters.onlyFavorites
            ? filters.startDate.toLocaleDateString("en-us", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "From"
        }
        disabled={filters.onlyFavorites}
        active={Boolean(filters.startDate)}
        onDisable={() => setFilters({ ...filters, startDate: null })}
      >
        <input
          className={Input}
          type="date"
          autoFocus
          value={filters.startDate ? dateToYYYYMMDD(filters.startDate) : ""}
          onChange={(e) => {
            const startDate = yyyymmddToDate(e.target.value);

            if (!isNaN(startDate.getTime())) {
              setFilters({
                ...filters,
                startDate,
              });
            }
          }}
        />
      </FilterChipInput>
      <FilterChipInput
        className="mt-2 mr-3"
        label={
          filters.endDate && !filters.onlyFavorites
            ? filters.endDate.toLocaleDateString("en-us", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "To"
        }
        disabled={filters.onlyFavorites}
        active={Boolean(filters.endDate)}
        onDisable={() => setFilters({ ...filters, endDate: null })}
      >
        <input
          className={Input}
          type="date"
          autoFocus
          value={filters.endDate ? dateToYYYYMMDD(filters.endDate) : ""}
          onChange={(e) => {
            const endDate = yyyymmddToDate(e.target.value);

            if (!isNaN(endDate.getTime())) {
              setFilters({
                ...filters,
                endDate,
              });
            }
          }}
        />
      </FilterChipInput>
      <FilterChip
        className="mt-2 mr-3"
        label="Sort by log date"
        active={filters.sortByLogDate}
        showCheck
        onClick={() =>
          setFilters({ ...filters, sortByLogDate: !filters.sortByLogDate })
        }
      />
      <FilterChip
        className="mt-2 mr-3"
        label={favoritesLabel()}
        active={filters.onlyFavorites}
        onClick={() =>
          setFilters({ ...filters, onlyFavorites: !filters.onlyFavorites })
        }
      />
    </div>
  );
}
