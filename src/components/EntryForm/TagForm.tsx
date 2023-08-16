import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import MultiSelect from "../MultiSelect";
import useTags from "../../hooks/useTags";

export interface Props
  extends Omit<ComponentPropsWithoutRef<"label">, "onBlur" | "onChange"> {
  logbooks: string[];
  value: (string | { new: string })[];
  onChange: (value: (string | { new: string })[]) => void;
}

export default function TagForm({
  logbooks,
  value,
  onChange,
  className,
  ...rest
}: Props) {
  const { tags, bumpTag, isLoading } = useTags({ logbooks });

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
