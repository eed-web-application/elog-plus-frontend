import { ComponentProps, FormEvent, useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Input, InputDisabled, InputInvalid } from "./base";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import useSelectList from "../hooks/useSelectList";
import SelectList from "./SelectList";
import SelectOption from "./SelectOption";

export type Option = string | { label: string; value: string };

interface Props<O extends Option>
  extends Omit<ComponentProps<"input">, "value"> {
  value: string | null;
  setValue: (selected: string | null) => void;
  options: Readonly<O[]>;
  isLoading?: boolean;
  containerClassName?: string;
  invalid?: boolean;
  nonsearchable?: boolean;
  emptyLabel?: string;
  onSearchChange?: (search: string) => void;
}

export default function Select<O extends Option>({
  value,
  setValue,
  options,
  isLoading,
  className,
  containerClassName,
  placeholder,
  invalid,
  nonsearchable,
  emptyLabel,
  onSearchChange,
  disabled,
  ...rest
}: Props<O>) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const updateSearch = useCallback(
    (search: string) => {
      setSearch(search);
      onSearchChange?.(search);
    },
    [setSearch, onSearchChange],
  );

  const filteredOptions = search
    ? options.filter((option) =>
      (typeof option === "string" ? option : option.label)
        .toLowerCase()
        .includes(search),
    )
    : options;

  let valuesLabel: string | undefined;
  if (value) {
    const option = options.find(
      (option) =>
        (typeof option === "string" ? option : option.value) === value,
    );
    valuesLabel = typeof option === "string" ? option : option?.label;
  }

  const { refs, floatingStyles, context } = useFloating({
    open: open,
    onOpenChange: (open) => {
      if (value && !open) {
        updateSearch("");
      }

      setOpen(open);
    },
    placement: "bottom-start",
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const role = useRole(context, { role: "listbox" });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    role,
    click,
    dismiss,
  ]);

  const {
    getFloatingProps: getListFloatingProps,
    getReferenceProps: getInputProps,
    getItemProps,
    activeIndex,
    listRef,
  } = useSelectList({ context, open });

  const select = useCallback(
    (option: O) => {
      setValue(typeof option == "string" ? option : option.value);
      updateSearch("");
      setOpen(false);
    },
    [setValue, updateSearch],
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.code === "Enter") {
      e.preventDefault();

      if (open && activeIndex !== null) {
        select(filteredOptions[activeIndex]);
      }
    }
  }

  return (
    // Flex is to fix weird layout issues when the input is a button
    <div
      {...getReferenceProps({
        className: twMerge("relative flex", containerClassName),
      })}
    >
      <input
        {...getInputProps({
          type: nonsearchable ? "button" : "text",
          className: twMerge(Input, invalid && InputInvalid, className),
          placeholder: value || !placeholder ? "" : placeholder,
          value: search,
          onChange: (e: FormEvent<HTMLInputElement>) => {
            updateSearch(e.currentTarget.value);

            if (!open) {
              setOpen(true);
            }
          },
          ref: refs.setReference,
          onKeyDown: onInputKeyDown,
          disabled: disabled,

          ...rest,
        })}
      />

      <div
        className={twMerge(
          // Using styles from Input to ensure padding is correct
          Input,
          disabled && InputDisabled,
          "absolute flex left-0 right-0 bottom-0 top-0 bg-transparent border-transparent pointer-events-none",
          className,
        )}
      >
        {value && !search ? valuesLabel : ""}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="self-end ml-auto w-6 h-6 text-gray-500 cursor-pointer"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>

      {open && (
        <FloatingPortal>
          <SelectList
            isLoading={isLoading}
            isEmpty={filteredOptions.length === 0}
            emptyLabel={emptyLabel}
            {...getFloatingProps(
              getListFloatingProps({
                ref: refs.setFloating,
                style: floatingStyles,
                className:
                  "max-h-64 overflow-y-auto rounded-lg shadow text-black bg-white z-10",
              }),
            )}
          >
            {filteredOptions.map((option, index) => (
              <SelectOption
                isActive={activeIndex === index}
                isSelected={
                  value === (typeof option === "string" ? option : option.value)
                }
                {...getItemProps({
                  key: typeof option === "string" ? option : option.value,
                  ref: (el) => (listRef.current[index] = el),
                  onMouseDown: () => {
                    select(option);
                  },
                })}
              >
                {typeof option === "string" ? option : option.label}
              </SelectOption>
            ))}
          </SelectList>
        </FloatingPortal>
      )}
    </div>
  );
}
