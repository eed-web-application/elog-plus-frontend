import { useEffect, useState } from "react";
import { fetchLogbooks, fetchTags } from "../api";
import { EntryQuery } from "../hooks/useEntries";
import Filter from "./Filter.tsx";
import FilterSelect from "./FilterSelect.tsx";
import { Input } from "./base.ts";
import Tag from "./Tag.tsx";

export type Filters = Pick<EntryQuery, "logbooks" | "tags" | "date">;

export interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function Filters({ filters, setFilters }: Props) {
  const [logbooks, setLogbooks] = useState<string[] | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then((logbooks) => setLogbooks(logbooks));
    }
  }, [logbooks]);

  useEffect(() => {
    if (!tags) {
      fetchTags().then((tags) => setTags(tags));
    }
  }, [tags]);

  function logbookFilterLabel() {
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
  }

  function tagFilterLabel() {
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
            <Tag
              key={tag}
              className={
                (index !== 1 && index !== filters.tags.length - 1) ||
                andOtherText
                  ? "mr-1"
                  : ""
              }
            >
              {tag}
            </Tag>
          ))}
          {andOtherText}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-wrap">
      <Filter
        className="mr-3 mt-2"
        label={logbookFilterLabel()}
        enabled={filters.logbooks.length !== 0}
        onDisable={() => setFilters({ ...filters, logbooks: [] })}
      >
        <FilterSelect
          selected={filters.logbooks}
          setSelected={(selected) =>
            setFilters({ ...filters, logbooks: selected })
          }
          isLoading={logbooks === null}
          options={logbooks || []}
        />
      </Filter>
      <Filter
        className="mr-3 mt-2"
        label={tagFilterLabel()}
        enabled={filters.tags.length !== 0}
        onDisable={() => setFilters({ ...filters, tags: [] })}
      >
        <FilterSelect
          selected={filters.tags}
          setSelected={(selected) => setFilters({ ...filters, tags: selected })}
          isLoading={tags === null}
          options={tags || []}
        />
      </Filter>
      <Filter
        className="mr-3 mt-2"
        label={
          filters.date
            ? new Date(filters.date).toLocaleDateString("en-us", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Date"
        }
        enabled={Boolean(filters.date)}
        onDisable={() => setFilters({ ...filters, date: "" })}
        inline
      >
        <input
          className={Input}
          type="date"
          autoFocus
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
      </Filter>
    </div>
  );
}
