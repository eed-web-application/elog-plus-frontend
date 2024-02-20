import { ComponentPropsWithoutRef } from "react";
import useLogbooks from "../../hooks/useLogbooks";
import { twMerge } from "tailwind-merge";
import MultiSelect from "../MultiSelect";

export interface Props
  extends Omit<ComponentPropsWithoutRef<"label">, "onBlur" | "onChange"> {
  value: string[];
  onChange: (value: string[]) => void;
  invalid?: boolean;
  onBlur: () => void;
}

export default function LogbookForm({
  value,
  onChange,
  invalid,
  className,
  onBlur,
  ...rest
}: Props) {
  const { logbooks, isLoading } = useLogbooks();

  return (
    <label className={twMerge("text-gray-500", className)} {...rest}>
      Logbook
      <MultiSelect
        required
        options={logbooks.map(({ name, id }) => ({
          label: name.toUpperCase(),
          value: id,
        }))}
        isLoading={isLoading}
        value={value}
        canCreate={()=>false}
        setValue={(logbooks) =>
          onChange(
            logbooks.filter(
              (logbook) => typeof logbook === "string"
            ) as string[]
          )
        }
        invalid={invalid}
        onBlur={onBlur}
      />
    </label>
  );
}
