import { Dispatch, HTMLProps, SetStateAction, useState } from "react";
import cn from "classnames";
import { Input, InputInvalid } from "./base";
import { size, useFloating } from "@floating-ui/react";
import Spinner from "./Spinner";
import Tag from "./Tag";
import useSelectCursor from "../useSelectCursor";

interface Props extends Omit<HTMLProps<HTMLInputElement>, "value"> {
  value: string[];
  setValue: Dispatch<SetStateAction<string[]>>;
  predefinedOptions: string[];
  isLoading?: boolean;
  invalid?: boolean;
}

export default function MultiSelect({
  value,
  setValue,
  predefinedOptions,
  isLoading,
  className,
  placeholder,
  invalid,
  onBlur,
  onFocus,
  ...rest
}: Props) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const filteredOptions = predefinedOptions.filter(
    (option) =>
      (!search || option.toLowerCase().includes(search.toLowerCase())) &&
      !value.includes(option)
  );

  const exactMatch = predefinedOptions.find(
    (option) => option.toLowerCase() === search.toLowerCase()
  );

  const showCreateButton = search && !exactMatch;

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

  const [cursor, cursorInputProps] = useSelectCursor(
    filteredOptions.length + (showCreateButton ? 1 : 0)
  );

  console.log(cursor);

  function createCustomOption() {
    if (!search) {
      return;
    }
    setSearch("");
    setValue((value) => [...value, search]);
  }

  function toggleSelection(option: string) {
    if (value.includes(option)) {
      setValue((value) =>
        value.filter((otherOption) => otherOption !== option)
      );
    } else {
      setValue((value) => [...value, option]);
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.code === "Enter") {
      e.preventDefault();
      if (cursor >= filteredOptions.length && showCreateButton) {
        createCustomOption();
      } else if (cursor >= 0 && filteredOptions.length > 0) {
        toggleSelection(filteredOptions[cursor]);
      }
    } else if (e.code === "Backspace" && search === "") {
      setValue((selected) => selected.slice(0, selected.length - 1));
    }
  }

  return (
    <div
      className={cn(
        Input,
        invalid && InputInvalid,
        focused && "outline-none ring-1 ring-blue-500 border-blue-500",
        className,
        "flex"
      )}
      ref={refs.setReference}
    >
      <div className="flex flex-wrap flex-1">
        {value.map((option) => (
          <Tag
            delectable
            className="mr-2"
            key={option}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onDelete={() =>
              setValue((value) =>
                value.filter((otherOption) => otherOption !== option)
              )
            }
          >
            {option}
          </Tag>
        ))}
        <input
          {...rest}
          type="text"
          placeholder={value && !placeholder ? "" : placeholder}
          value={search}
          className="flex-1 outline-none bg-transparent w-fit"
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => {
            onFocus?.(e);
            setFocused(true);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            setFocused(false);
          }}
          onKeyDown={(e) => {
            cursorInputProps.onKeyDown(e);
            onInputKeyDown(e);
          }}
          size={search.length + 1}
        />
      </div>

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
