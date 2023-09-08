import { ComponentProps, useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Input, InputDisabled, InputInvalid } from "./base";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  size,
  useFloating,
} from "@floating-ui/react";
import Spinner from "./Spinner";
import useSelectCursor from "../hooks/useSelectCursor";

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
  noOptionsLabel?: string;
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
  noOptionsLabel,
  onSearchChange,
  onBlur,
  disabled,
  ...rest
}: Props<O>) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const updateSearch = useCallback(
    (search: string) => {
      setSearch(search);
      onSearchChange?.(search);
    },
    [setSearch, onSearchChange]
  );

  const filteredOptions = search
    ? options.filter((option) =>
        (typeof option === "string" ? option : option.label)
          .toLowerCase()
          .includes(search)
      )
    : options;

  let valuesLabel: string | undefined;
  if (value) {
    const option = options.find(
      (option) => (typeof option === "string" ? option : option.value) === value
    );
    valuesLabel = typeof option === "string" ? option : option?.label;
  }

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
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

  useEffect(() => {
    if (value && !isOpen) {
      updateSearch("");
    }
  }, [value, isOpen]);

  const {
    cursor,
    setCursor,
    optionRefs,
    onInputKeyDown: inputKeyDownCursorHandler,
  } = useSelectCursor(filteredOptions.length);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isOpen) {
      inputKeyDownCursorHandler(e);
    } else if (e.code === "ArrowDown" || e.code === "ArrowUp") {
      setIsOpen(true);
    }

    if (e.code === "Enter") {
      e.preventDefault();

      if (isOpen) {
        const option = filteredOptions[cursor];
        setValue(typeof option == "string" ? option : option.value);
        updateSearch("");
        setIsOpen(false);
      }
    }
  }

  return (
    // Flex is to fix weird layout issues when the input is a button
    <div className={twMerge("relative flex", containerClassName)}>
      <input
        {...rest}
        type={nonsearchable ? "button" : "text"}
        className={twMerge(Input, invalid && InputInvalid, className)}
        placeholder={value || !placeholder ? "" : placeholder}
        value={search}
        onChange={(e) => {
          updateSearch(e.target.value);
          if (!isOpen) {
            setIsOpen(true);
          }
        }}
        ref={refs.setReference}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          onBlur?.(e);
          setIsOpen(false);
        }}
        onKeyDown={onInputKeyDown}
        disabled={disabled}
      />

      <div
        className={twMerge(
          // Using styles from Input to ensure padding is correct
          Input,
          disabled && InputDisabled,
          "absolute flex left-0 right-0 bottom-0 top-0 bg-transparent border-transparent pointer-events-none",
          className
        )}
      >
        {value && !search ? valuesLabel : ""}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="cursor-pointer self-end ml-auto w-6 h-6 text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="max-h-64 overflow-y-auto rounded-lg shadow text-black bg-white z-10"
          >
            {filteredOptions.length === 0 || isLoading ? (
              <div className="text-gray-500 text-center w-full py-3">
                {isLoading ? (
                  <Spinner className="m-auto" />
                ) : (
                  noOptionsLabel || "No options"
                )}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const selected =
                  value ===
                  (typeof option === "string" ? option : option.value);
                const focused = cursor === index;

                return (
                  <div
                    tabIndex={0}
                    key={typeof option === "string" ? option : option.value}
                    ref={(el) => (optionRefs.current[index] = el)}
                    className={twMerge(
                      "px-2 p-1 cursor-pointer hover:bg-gray-100",
                      focused && "bg-gray-100",
                      selected && "bg-blue-100 hover:bg-blue-200",
                      selected && focused && "bg-blue-200"
                    )}
                    onMouseDown={() => {
                      setValue(
                        typeof option === "string" ? option : option.value
                      );
                    }}
                    onMouseEnter={() => {
                      setCursor(index);
                    }}
                  >
                    {typeof option === "string" ? option : option.label}
                  </div>
                );
              })
            )}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
