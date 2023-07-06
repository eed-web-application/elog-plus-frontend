import { useEffect, useState } from "react";
import { fetchLogbooks } from "../api.ts";
import Filter from "./Filter.tsx";
import LogbookSelect from "./LogbookSelect.tsx";
import { Input } from "./base.ts";

export interface Filters {
  logbooks: string[];
  date: string;
}

export interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function Filters({ filters, setFilters }: Props) {
  const [logbooks, setLogbooks] = useState<string[] | null>(null);

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then((logbooks) => setLogbooks(logbooks));
    }
  }, [logbooks]);

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

  return (
    <div className="flex">
      <Filter
        className="mr-3"
        label={logbookFilterLabel()}
        enabled={filters.logbooks.length !== 0}
        onDisable={() => setFilters({ ...filters, logbooks: [] })}
        onClose={() => setFilters(filters)}
      >
        <LogbookSelect
          selected={filters.logbooks}
          setSelected={(selected) =>
            setFilters({ ...filters, logbooks: selected })
          }
          isLoading={logbooks === null}
          options={logbooks || []}
        />
      </Filter>
      <Filter
        className="mr-3"
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
        onClose={() => setFilters(filters)}
        inline
      >
        <input
          className={Input}
          type="date"
          autoFocus
          value={filters.date}
          onChange={(e) =>
            setFilters({ ...filters, date: e.currentTarget.value })
          }
        />
      </Filter>
    </div>
  );
}
