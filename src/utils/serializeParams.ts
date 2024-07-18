import { format } from "date-fns";

export type ParamsObject = Record<
  string,
  null | boolean | number | string | string[] | Date
>;

export default function serializeParams(
  params: ParamsObject,
): [string, string][] {
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
        return [key, format(value, "yyyy-MM-dd")];
      }

      return [key, value.toString()];
    }) as [string, string][]
  );
}
