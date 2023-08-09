import { twMerge } from "tailwind-merge";
import { useState } from "react";
import Spinner from "./Spinner";
import { Input } from "./base";
import useSelectCursor from "../hooks/useSelectCursor";

export interface Props {
  selected: string[];
  onOptionSelected?: (option: string) => void;
  setSelected: (options: string[]) => void;
  options: string[];
  isLoading: boolean;
}

/**
 * Multiselect with search input directly above options and no floating elements
 */
export default function MultiSelectMenu({
  selected,
  setSelected,
  onOptionSelected,
  options,
  isLoading,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredOptions = search
    ? options.filter((option) => option.toLowerCase().includes(search))
    : options;

  function selectOption(option: string) {
    if (selected.includes(option)) {
      setSelected(selected.filter((x) => x !== option));
    } else {
      onOptionSelected?.(option);
      setSelected([...selected, option]);
    }
  }

  const {
    onInputKeyDown: inputKeyDownCursorHandler,
    optionRefs,
    setCursor,
    cursor,
  } = useSelectCursor(filteredOptions.length);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    inputKeyDownCursorHandler(e);

    if (e.code === "Enter") {
      e.preventDefault();

      if (filteredOptions[cursor]) {
        selectOption(filteredOptions[cursor]);
      }
    }
  }

  return (
    <>
      <input
        type="search"
        className={twMerge(Input, "block w-64 rounded-b-none")}
        placeholder="Search..."
        autoFocus
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={onInputKeyDown}
      />
      <div className="max-h-64 overflow-y-auto">
        {filteredOptions.length === 0 || isLoading ? (
          <div className="text-gray-500 text-center w-full py-3">
            {isLoading ? <Spinner className="m-auto" /> : "No options"}
          </div>
        ) : (
          filteredOptions.map((option, index) => {
            const focused = cursor === index;
            const optionSelected = selected.includes(option);
            return (
              <div
                tabIndex={0}
                key={option}
                className={twMerge(
                  "px-2 p-1 cursor-pointer hover:bg-gray-100",
                  focused && "bg-gray-100",
                  optionSelected && "bg-blue-100 hover:bg-blue-200",
                  optionSelected && focused && "bg-blue-200"
                )}
                // To prevent blur on search input
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setCursor(index)}
                ref={(el) => (optionRefs.current[index] = el)}
              >
                {option}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
