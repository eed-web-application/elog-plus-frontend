import { useEffect, useState } from "react";
import { Entry } from "../api";
import Dialog from "./Dialog";
import useEntryQuery from "../hooks/useEntryQuery";
import useEntries from "../hooks/useEntries";
import Filters from "../components/Filters";
import EntryListGrouped from "./EntryListGrouped";
import useLogbooks from "../hooks/useLogbooks";
import EntrySearchBar from "./EntrySearchBar";
import { useDialog } from "../hooks/useDialog";

export default function EntrySelectDialog({
  onSelect,
}: {
  onSelect: (entry: Entry) => void;
}) {
  const { setOpen } = useDialog();

  const existingQuery = useEntryQuery()[0];
  const [query, setQuery] = useState(existingQuery);

  useEffect(() => {
    setQuery(existingQuery);
  }, [existingQuery, setQuery]);

  const { isLoading: isLogbooksLoading, logbookNameMap } = useLogbooks();
  const {
    isLoading: isEntriesLoading,
    entries,
    getMoreEntries,
    reachedBottom,
  } = useEntries({
    enabled: !isLogbooksLoading,
    query: {
      ...query,
      logbooks: isLogbooksLoading
        ? []
        : query.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id),
    },
  });

  const isLoading = isEntriesLoading || isLogbooksLoading;
  const includedLogbooks = isLogbooksLoading
    ? []
    : query.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id);

  return (
    <Dialog.Window
      showCloseButton
      className="container max-w-3xl h-screen overflow-y-hidden flex flex-col my-3"
    >
      <Dialog.Section className="text-lg">Select entry</Dialog.Section>
      <Dialog.Section>
        <EntrySearchBar
          search={query.search}
          onSearchChange={(search) => setQuery({ ...query, search })}
        />
        <Filters
          filters={query}
          onFiltersChange={(filters) => setQuery({ ...query, ...filters })}
        />
      </Dialog.Section>
      <Dialog.Section className="flex-1 overflow-hidden">
        <EntryListGrouped
          containerClassName="min-w-[384px] flex-1"
          entries={entries || []}
          emptyLabel="No entries found"
          selected={location.pathname.split("/")[1]}
          isLoading={isLoading}
          logbooksIncluded={includedLogbooks}
          onBottomVisible={reachedBottom ? undefined : getMoreEntries}
          dateBasedOn={query.sortByLogDate ? "loggedAt" : "eventAt"}
          onEntryClick={(entry) => {
            setOpen(false);
            onSelect(entry);
          }}
        />
      </Dialog.Section>
    </Dialog.Window>
  );
}
