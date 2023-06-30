import { useEffect, useState } from "react";
import { fetchLogbooks } from "../api.ts";
import Filter from "./Filter.tsx";
import LogbookSelect from "./LogbookSelect.tsx";

export interface Filters {
  logbooks: string[];
}

export interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function Filters({ filters, setFilters }: Props) {
  const [logbooks, setLogbooks] = useState<string[] | null>(null);
  const [stagedFilters, setStagedFilters] = useState(filters);

  useEffect(() => {
    setStagedFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then((logbooks) => setLogbooks(logbooks));
    }
  }, [logbooks]);

  function logbookFilterLabel() {
    if (stagedFilters.logbooks.length === 0) {
      return "Logbook";
    }

    let out = stagedFilters.logbooks[0];
    if (stagedFilters.logbooks.length > 1) {
      out += ` and ${stagedFilters.logbooks.length - 1} other`;
      if (stagedFilters.logbooks.length > 2) {
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
        enabled={stagedFilters.logbooks.length !== 0}
        onDisable={() => setFilters({ ...stagedFilters, logbooks: [] })}
        onClose={() => setFilters(stagedFilters)}
      >
        <LogbookSelect
          selected={stagedFilters.logbooks}
          setSelected={(selected) =>
            setStagedFilters({ ...stagedFilters, logbooks: selected })
          }
          isLoading={logbooks === null}
          options={logbooks || []}
        />
      </Filter>
      <Filter className="mr-3" enabled={false} label="From"></Filter>
      <Filter className="mr-3" enabled={false} label="To"></Filter>
    </div>
  );
}
