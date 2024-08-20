import { useCallback, useMemo } from "react";
import { yyyymmddToDate } from "../utils/datetimeConversion";
import { EntryQuery } from "./useEntries";
import { NavigateOptions, useSearchParams } from "react-router-dom";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export const DEFAULT_QUERY: EntryQuery = {
  logbooks: [],
  tags: [],
  requireAllTags: false,
  startDate: null,
  endDate: null,
  search: "",
  sortByLogDate: false,
  onlyFavorites: false,
};

function deserializeQuery(params: URLSearchParams): EntryQuery {
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  return {
    logbooks: params.get("logbooks")?.split(",") ?? DEFAULT_QUERY.logbooks,
    tags: params.get("tags")?.split(",") ?? DEFAULT_QUERY.tags,
    requireAllTags: params.has("requireAllTags"),
    startDate: startDate ? yyyymmddToDate(startDate) : DEFAULT_QUERY.startDate,
    endDate: endDate ? yyyymmddToDate(endDate) : DEFAULT_QUERY.endDate,
    search: params.get("search") ?? DEFAULT_QUERY.search,
    sortByLogDate: params.has("sortByLogDate"),
    onlyFavorites: params.has("onlyFavorites"),
  };
}

export default function useEntryQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => deserializeQuery(searchParams), [searchParams]);
  const setQuery = useCallback(
    (query: EntryQuery, navigateOptions?: NavigateOptions) => {
      setSearchParams(serializeParams(query as ParamsObject), navigateOptions);
    },
    [setSearchParams],
  );

  return [query, setQuery] as [
    EntryQuery,
    (query: EntryQuery, navigateOptions?: NavigateOptions) => void,
  ];
}