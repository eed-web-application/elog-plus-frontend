import { ComponentProps, FormEvent, useCallback, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
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
  useFocus,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import useSelectList from "../hooks/useSelectList";
import SelectList from "./SelectList";
import SelectOption from "./SelectOption";

export type ValuedOption = { label: string; value: string };
export type Option = string | ValuedOption;

export type SearchType = "managed" | "unmanaged" | "none";

interface Props<O extends Option>
  extends Omit<ComponentProps<"input">, "value"> {
  value: Option | null;
  setValue: (selected: string | null) => void;
  options: Readonly<O[]>;
  isLoading?: boolean;
  containerClassName?: string;
  invalid?: boolean;
  searchType?: SearchType;
  emptyLabel?: string;
  onSearchChange?: (search: string) => void;
  onBottomVisible?: () => void;
}

export default function Select<O extends Option>({
  value: selected,
  setValue,
  options,
  isLoading,
  className,
  containerClassName,
  placeholder,
  invalid,
  searchType = "unmanaged",
  emptyLabel,
  onSearchChange,
  onBottomVisible,
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

  const filteredOptions =
    searchType === "unmanaged" && search
      ? options.filter((option) =>
          (typeof option === "string" ? option : option.label)
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : options;

  let selectedLabel: string | undefined;
  let selectedValue: string | undefined;
  if (typeof selected === "string") {
    selectedValue = selected;

    const option = options.find(
      (option) =>
        (typeof option === "string" ? option : option.value) === selected,
    );
    selectedLabel = typeof option === "string" ? option : option?.label;
  } else if (selected !== null) {
    selectedValue = selected.value;
    selectedLabel = selected.label;
  }

  const { refs, floatingStyles, context } = useFloating({
    open: open,
    onOpenChange: (open) => {
      if (selected && !open) {
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
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const { selectList, activeIndex, listRef } = useSelectList({ context, open });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [role, click, focus, dismiss, selectList],
  );

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
    <div className={twMerge("relative flex", containerClassName)}>
      <input
        {...getReferenceProps({
          type: searchType === "none" ? "button" : "text",
          className: twMerge(
            Input,
            invalid && InputInvalid,
            searchType === "none" && "cursor-pointer",
            className,
            // 72px is the width of the dropdown icon + add button + padding
            "pr-[72px]",
          ),
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
          "absolute flex left-0 right-0 bottom-0 top-0 bg-transparent border-transparent pointer-events-none overflow-hidden whitespace-nowrap",
          className,
        )}
      >
        <div
          className={twJoin(
            "flex-1 overflow-x-auto",
            !selected && !search && "text-gray-500",
          )}
        >
          {selected && !search ? selectedLabel : search ? "" : placeholder}
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="self-center ml-auto w-6 h-6 text-gray-500 cursor-pointer"
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
            onBottomVisible={onBottomVisible}
            {...getFloatingProps({
              ref: refs.setFloating,
              style: floatingStyles,
              className:
                "max-h-64 overflow-y-auto rounded-lg shadow text-black bg-white z-10",
            })}
          >
            {filteredOptions.map((option, index) => (
              <SelectOption
                isActive={activeIndex === index}
                isSelected={
                  selectedValue ===
                  (typeof option === "string" ? option : option.value)
                }
                key={typeof option === "string" ? option : option.value}
                {...getItemProps({
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
