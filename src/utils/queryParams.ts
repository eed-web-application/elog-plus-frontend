import { EntryQuery } from "../hooks/useEntries";
import { dateToYYYYMMDD, yyyymmddToDate } from "./datetimeConversion";

export type ParamsObject = Record<
  string,
  null | boolean | number | string | string[] | Date
>;

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

export function deserializeQuery(params: URLSearchParams): EntryQuery {
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

export function serializeQuery(params: ParamsObject): [string, string][] {
  return (
    (
      Object.entries(params)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, value]) =>
          Array.isArray(value) ? value.length > 0 : Boolean(value),
        ) as [string, NonNullable<ParamsObject[string]>][]
    ).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, value.join(",")];
      }
      if (value instanceof Date) {
        return [key, dateToYYYYMMDD(value)];
      }

      return [key, value.toString()];
    }) as [string, string][]
  );
}
