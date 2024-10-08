import { ComponentPropsWithoutRef, useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import MultiSelect from "../MultiSelect";
import useTags from "../../hooks/useTags";
import { Logbook } from "../../api";
import { Draft, NewTag } from "../../draftsStore";
import Dialog from "../Dialog";
import TagLogbookSelectorDialog from "../TagLogbookSelectorDialog";

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
  const [logbookSelect, setLogbookSelect] = useState<null | {
    tag: string;
    logbooks: Logbook[];
  }>(null);

  const logbookMap = logbooks.reduce<Record<string, Logbook>>(
    (acc, logbook) => {
      acc[logbook.id] = logbook;
      return acc;
    },
    {},
  );

  isLoading = isLoading || isTagsLoading;

  let selected: (string | (NewTag & { custom: string }))[] = [];

  if (!isLoading) {
    selected = value.map((tag) =>
      typeof tag === "string"
        ? tag
        : {
            ...tag,
            custom: `${logbookMap[tag.logbook].name.toUpperCase()}:${tag.name}`,
          },
    );
  }

  const withoutTag = useCallback(
    (tagName: string) => (logbook: Logbook) =>
      !logbook.tags.some((tag) => tag.name === tagName) &&
      // Need to take into account newly created tags
      !value.some(
        (tag) =>
          typeof tag !== "string" &&
          tag.logbook === logbook.id &&
          tag.name === tagName,
      ),
    [value],
  );

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
          value={selected}
          setValue={(tags) => onChange(tags)}
          canCreate={(query) => logbooks.some(withoutTag(query))}
          onCreate={(name) => {
            const logbooksWithoutTag = logbooks.filter(withoutTag(name));

            if (logbooksWithoutTag.length === 1) {
              onChange(
                value.concat({
                  logbook: logbooksWithoutTag[0].id,
                  name,
                }),
              );
              return;
            }

            setLogbookSelect({ tag: name, logbooks: logbooksWithoutTag });
          }}
        />
      </label>
      <Dialog
        controlled
        isOpen={Boolean(logbookSelect)}
        onOpenChange={(open) => {
          if (!open) {
            setLogbookSelect(null);
          }
        }}
      >
        <Dialog.Content>
          <TagLogbookSelectorDialog
            logbooks={logbookSelect?.logbooks || []}
            tag={logbookSelect?.tag || ""}
            onSelect={(selectedLogbooks) => {
              onChange(
                value.concat(
                  selectedLogbooks.map((logbook) => ({
                    logbook,
                    name: logbookSelect?.tag || "",
                  })),
                ),
              );
            }}
          />
        </Dialog.Content>
      </Dialog>
    </>
  );
}
