import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import MultiSelect from "../MultiSelect";
import useTags from "../../hooks/useTags";
import { LogbookSummary } from "../../api";

export interface Props
  extends Omit<ComponentPropsWithoutRef<"label">, "onBlur" | "onChange"> {
  logbooks: LogbookSummary[];
  value: (string | { new: string })[];
  isLoading?: boolean;
  onChange: (value: (string | { new: string })[]) => void;
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
    bumpTag,
    isLoading: isTagsLoading,
  } = useTags({ logbooks, enabled: !isLoading });

  isLoading = isLoading || isTagsLoading;

  return (
    <label className={twMerge("text-gray-500", className)} {...rest}>
      Tags
      <MultiSelect
        disabled={isLoading}
        isLoading={isLoading}
        options={tags.map(({ name, id }) => ({
          label: name,
          value: id,
        }))}
        onOptionSelected={bumpTag}
        value={value.map((tag) =>
          typeof tag === "string" ? tag : { custom: tag.new }
        )}
        setValue={(tags) =>
          onChange(
            tags.map((tag) =>
              typeof tag === "string" ? tag : { new: tag.custom }
            )
          )
        }
        allowCustomOptions
      />
    </label>
  );
}
