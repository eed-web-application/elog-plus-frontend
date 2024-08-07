import { ComponentProps, FocusEvent, FormEvent, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Input, InputDisabled, InputInvalid } from "./base";
import {
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
import Chip from "./Chip";
import SelectOption from "./SelectOption";
import SelectList from "./SelectList";
import useSelectList from "../hooks/useSelectList";

type Option = { label: string; value: string };

type Props<C extends { custom: string }> = {
  options: Option[];
  onOptionSelected?: (option: string) => void;
  isLoading?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  value: (string | C)[];
  setValue: (value: (string | C)[]) => void;
  canCreate?: (query: string) => boolean;
  onCreate?: (name: string) => void;
} & Omit<ComponentProps<"input">, "value">;

function getLabel(option: string | Option | { custom: string }): string {
  if (typeof option === "string") {
    return option;
  }
  if ("custom" in option) {
    return option.custom;
  }
  return option.label;
}

function getValue(option: string | Option | { custom: string }): string {
  if (typeof option === "string") {
    return option;
  }
  if ("custom" in option) {
    return option.custom;
  }
  return option.value;
}

export default function MultiSelect<C extends { custom: string }>({
  value,
  setValue,
  onOptionSelected,
  options,
  isLoading,
  className,
  placeholder,
  invalid,
  disabled,
  canCreate,
  onCreate,
  onBlur,
  onFocus,
  ...rest
}: Props<C>) {
  const [untrimedSearch, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const search = untrimedSearch.trim();

  const optionsMap = options.reduce<
    Record<string, Option | { custom: string }>
  >((acc, option) => {
    acc[getValue(option)] = option;
    return acc;
  }, {});

  // Include custom options in the options map
  for (const option of value) {
    if (typeof option !== "string") {
      optionsMap[option.custom] = option;
    }
  }

  const selected = value
    .map((selectedOption) =>
      typeof selectedOption === "string"
        ? optionsMap[selectedOption]
        : selectedOption,
    )
    .filter((x) => x) as (Option | { custom: string })[];

  const filteredOptions = options.filter(
    (option) =>
      (!search || option.label.toLowerCase().includes(search.toLowerCase())) &&
      // Exclude selected options
      !value.includes(option.value),
  );

  const customOptions = (
    value.filter((option) => typeof option !== "string") as { custom: string }[]
  ).map(({ custom }) => custom);

  const exactMatch = options
    .map((option) => option.label)
    .concat(customOptions)
    .find((option) => option.toLowerCase() === search.toLowerCase());

  const showCreateButton =
    search && !exactMatch && (canCreate ? canCreate(search) : true);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
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
  const click = useClick(context, { toggle: false });
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

  function createCustomOption() {
    if (!search) {
      return;
    }

    setSearch("");
    onCreate?.(search);
    onOptionSelected?.(search);
  }

  function toggleSelection(option: string) {
    setSearch("");

    if (value.includes(option)) {
      setValue(value.filter((otherOption) => otherOption !== option));
    } else {
      setValue([...value, option]);
      onOptionSelected?.(option);
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.code === "Enter" && activeIndex !== null) {
      e.preventDefault();

      if (activeIndex >= filteredOptions.length && showCreateButton) {
        createCustomOption();
      } else if (filteredOptions.length > 0) {
        const option = filteredOptions[activeIndex];

        toggleSelection(getValue(option));
        setSearch("");
      }
    } else if (e.code === "Backspace" && search === "") {
      setValue(value.slice(0, value.length - 1));
    }
  }

  return (
    <div
      ref={refs.setReference}
      className={twMerge(
        Input,
        invalid && InputInvalid,
        disabled && InputDisabled,
        "flex",
        focused && "outline-none ring-1 ring-blue-500 border-blue-500",
        className,
      )}
      {...getReferenceProps({
        onMouseDown: (e) => {
          if (!(e.target instanceof HTMLInputElement)) {
            e.preventDefault();
          }
        },
      })}
    >
      <div className="flex flex-wrap flex-1 items-center">
        {selected.map((option) => (
          <Chip
            deletable
            className="mr-2"
            key={"custom" in option ? option.custom : option.value}
            onDelete={() =>
              setValue(
                value.filter(
                  (otherOption) => getValue(otherOption) !== getValue(option),
                ),
              )
            }
          >
            {getLabel(option)}
          </Chip>
        ))}
        <input
          {...getInputProps({
            type: "text",
            role: "combobox",
            placeholder: value && !placeholder ? "" : placeholder,
            value: untrimedSearch,
            className: "flex-1 outline-none bg-transparent w-fit",
            onChange: (e: FormEvent<HTMLInputElement>) =>
              setSearch(e.currentTarget.value),
            onKeyDown: onInputKeyDown,
            size: untrimedSearch.length + 1,
            disabled,
            onFocus: (e: FocusEvent<HTMLInputElement>) => {
              onFocus?.(e);
              setFocused(true);
            },
            onBlur: (e: FocusEvent<HTMLInputElement>) => {
              onBlur?.(e);
              setFocused(false);
            },
          })}
        />
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
      {open && (
        <SelectList
          isLoading={isLoading}
          {...getFloatingProps(
            getListFloatingProps({
              ref: refs.setFloating,
              style: floatingStyles,
              className:
                "max-h-64 overflow-y-auto rounded-lg shadow text-black bg-white z-10",
            }),
          )}
        >
          <>
            {filteredOptions.map((option, index) => (
              <SelectOption
                isActive={activeIndex === index}
                {...getItemProps({
                  key: getValue(option),
                  onMouseDown: (e) => {
                    e.preventDefault();
                    toggleSelection(getValue(option));
                  },
                  ref: (el) => (listRef.current[index] = el),
                  ...rest,
                })}
              >
                {getLabel(option)}
              </SelectOption>
            ))}
            {showCreateButton && (
              <SelectOption
                isActive={activeIndex === filteredOptions.length}
                {...getItemProps({
                  ref: (el) => (listRef.current[filteredOptions.length] = el),
                  onMouseDown: (e) => {
                    // In the TagForm, when the create button is clicked,
                    // a dialog is opened, so we have this here to ensure
                    // that the dialog doesn't immediately close by this click.
                    e.stopPropagation();

                    createCustomOption();
                  },
                })}
              >
                <span className="text-gray-500">Create</span> {search}
              </SelectOption>
            )}
          </>
        </SelectList>
      )}
    </div>
  );
}
