import { ComponentProps, useState } from "react";
import cn from "classnames";
import { Input, InputDisabled, InputInvalid } from "./base";
import { size, useFloating } from "@floating-ui/react";
import Spinner from "./Spinner";
import Chip from "./Chip";
import useSelectCursor from "../hooks/useSelectCursor";

interface Props extends Omit<ComponentProps<"input">, "value"> {
  value: string[];
  setValue: (value: string[]) => void;
  onOptionSelected: (option: string) => void;
  predefinedOptions: string[];
  isLoading?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}

export default function MultiSelect({
  value,
  setValue,
  onOptionSelected,
  predefinedOptions,
  isLoading,
  className,
  placeholder,
  invalid,
  disabled,
  onBlur,
  onFocus,
  ...rest
}: Props) {
  const [untrimedSearch, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const search = untrimedSearch.trim();

  const filteredOptions = predefinedOptions.filter(
    (option) =>
      (!search || option.toLowerCase().includes(search.toLowerCase())) &&
      !value.includes(option)
  );

  const exactMatch = predefinedOptions.find(
    (option) => option.toLowerCase() === search.toLowerCase()
  );

  const showCreateButton = search && !exactMatch;

  // TODO: Update on resize
  const { refs, floatingStyles } = useFloating({
    open: focused,
    placement: "bottom-start",
    middleware: [
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const {
    cursor,
    optionRefs,
    setCursor,
    onInputKeyDown: inputKeyDownCursorHandler,
  } = useSelectCursor(filteredOptions.length + (showCreateButton ? 1 : 0));

  function createCustomOption() {
    if (!search) {
      return;
    }
    setSearch("");
    setValue([...value, search]);
    onOptionSelected(search);
  }

  function toggleSelection(option: string) {
    setSearch("");
    if (value.includes(option)) {
      setValue(value.filter((otherOption) => otherOption !== option));
    } else {
      setValue([...value, option]);
      onOptionSelected(option);
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    inputKeyDownCursorHandler(e);

    if (e.code === "Enter") {
      e.preventDefault();
      if (cursor >= filteredOptions.length && showCreateButton) {
        createCustomOption();
      } else if (cursor >= 0 && filteredOptions.length > 0) {
        toggleSelection(filteredOptions[cursor]);
        setSearch("");
      }
    } else if (e.code === "Backspace" && search === "") {
      setValue(value.slice(0, value.length - 1));
    }
  }

  return (
    <div
      className={cn(
        Input,
        invalid && InputInvalid,
        disabled && InputDisabled,
        focused && "outline-none ring-1 ring-blue-500 border-blue-500",
        className,
        "flex pb-1 pt-1"
      )}
      ref={refs.setReference}
    >
      <div className="flex flex-wrap flex-1 items-center">
        {value.map((option) => (
          <Chip
            delectable
            className="mr-2 my-1"
            key={option}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onDelete={() =>
              setValue(value.filter((otherOption) => otherOption !== option))
            }
          >
            {option}
          </Chip>
        ))}
        <input
          {...rest}
          type="text"
          placeholder={value && !placeholder ? "" : placeholder}
          value={untrimedSearch}
          className="flex-1 outline-none bg-transparent w-fit my-1"
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => {
            onFocus?.(e);
            setFocused(true);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            setFocused(false);
          }}
          onKeyDown={onInputKeyDown}
          size={untrimedSearch.length + 1}
          disabled={disabled}
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
      {focused && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="max-h-64 overflow-y-auto rounded-lg shadow mt-2 text-black bg-white z-10"
        >
          {isLoading ? (
            <div className="text-center w-full py-3">
              <Spinner className="m-auto" />
            </div>
          ) : (
            <>
              {filteredOptions.map((option, index) => {
                return (
                  <div
                    tabIndex={0}
                    key={option}
                    className={cn(
                      "px-2 p-1 cursor-pointer hover:bg-gray-100",
                      cursor === index && "bg-gray-100"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleSelection(option);
                    }}
                    onMouseEnter={() => setCursor(index)}
                    ref={(el) => (optionRefs.current[index] = el)}
                  >
                    {option}
                  </div>
                );
              })}
              {showCreateButton && (
                <div
                  className={cn(
                    "px-2 p-1 cursor-pointer hover:bg-gray-100",
                    cursor === filteredOptions.length && "bg-gray-100"
                  )}
                  onMouseDown={createCustomOption}
                  onMouseEnter={() => setCursor(filteredOptions.length)}
                  ref={(el) =>
                    (optionRefs.current[filteredOptions.length] = el)
                  }
                >
                  <span className="text-gray-500">Create</span> {search}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
