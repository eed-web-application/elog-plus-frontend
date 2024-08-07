import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import MultiSelect from "../MultiSelect";
import useTags from "../../hooks/useTags";
import { Logbook } from "../../api";
import useTagLogbookSelector from "../../hooks/useTagLogbookSelector";
import { Draft } from "../../draftsStore";

export interface Props
  extends Omit<ComponentPropsWithoutRef<"label">, "onBlur" | "onChange"> {
  logbooks: Logbook[];
  value: Draft["tags"];
  isLoading?: boolean;
  onChange: (newValue: Draft["tags"]) => void;
}

export default function TagForm({
  logbooks,
  value,
  isLoading,
  onChange,
  className,
  ...rest
}: Props) {
  const {
    tags,
    tagMap,
    bumpTag,
    isLoading: isTagsLoading,
  } = useTags({ logbooks: logbooks?.map(({ id }) => id), enabled: !isLoading });

  const logbookMap = logbooks.reduce<Record<string, Logbook>>(
    (acc, logbook) => {
      acc[logbook.id] = logbook;
      return acc;
    },
    {},
  );

  isLoading = isLoading || isTagsLoading;

  const { Dialog: LogbookSelectorDialog, select: selectLogbooks } =
    useTagLogbookSelector();

  return (
    <>
      <label className={twMerge("text-gray-500", className)} {...rest}>
        Tags
        <MultiSelect
          placeholder={isLoading ? "Loading..." : undefined}
          disabled={isLoading}
          isLoading={isLoading}
          options={tags.map(({ name, id }) => ({
            label: `${tagMap[id].logbook.name.toUpperCase()}:${name}`,
            value: id,
          }))}
          onOptionSelected={bumpTag}
          value={
            isLoading
              ? []
              : value.map((tag) =>
                  typeof tag === "string"
                    ? tag
                    : {
                        ...tag,
                        custom: `${logbookMap[
                          tag.logbook
                        ].name.toUpperCase()}:${tag.name}`,
                      },
                )
          }
          setValue={(tags) => onChange(tags)}
          canCreate={(query) =>
            logbooks.some(
              (logbook) =>
                !logbook.tags.some((tag) => tag.name === query) &&
                // Need to take into account newly created tags
                !value.some(
                  (tag) =>
                    typeof tag !== "string" &&
                    tag.logbook === logbook.id &&
                    tag.name === query,
                ),
            )
          }
          onCreate={async (name) => {
            const logbooksWithoutTag = logbooks.filter(
              (logbook) =>
                !logbook.tags.some((tag) => tag.name === name) &&
                // Need to take into account newly created tags
                !value.some(
                  (tag) =>
                    typeof tag !== "string" &&
                    tag.logbook === logbook.id &&
                    tag.name === name,
                ),
            );

            const selectedLogbooks = await selectLogbooks(
              name,
              logbooksWithoutTag,
            );

            if (!selectedLogbooks) {
              return;
            }

            onChange(
              value.concat(
                selectedLogbooks.map((logbook) => ({ logbook, name })),
              ),
            );
          }}
        />
      </label>
      {LogbookSelectorDialog}
    </>
  );
}
