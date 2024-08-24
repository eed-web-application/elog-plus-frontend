import { FormEvent, ReactNode, useState } from "react";
import FilterChip, { Props as FilterChipProps } from "./FilterChip";
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import useSelectList from "../hooks/useSelectList";
import SelectList from "./SelectList";
import SelectOption from "./SelectOption";
import { twMerge } from "tailwind-merge";
import { Input } from "./base";

export interface Props<O> extends FilterChipProps {
  options: O[];
  selected: string[];
  setSelected: (options: string[]) => void;
  extractLabel: (option: O) => string;
  extractKey: (option: O) => string;
  searchButton?: ReactNode;
  isLoading?: boolean;

  onOptionSelected?: (option: string) => void;
  onClose?: () => void;
  onOpen?: () => void;
  onDisable?: () => void;
}

export default function FilterChipMultiSelect<O>({
  options,
  selected,
  setSelected,
  extractLabel,
  extractKey,
  searchButton,
  isLoading,

  onOptionSelected,
  onClose,
  onOpen,
  onDisable,
  ...rest
}: Props<O>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (isOpen) => {
      if (isOpen) {
        onOpen?.();
      } else {
        onClose?.();
      }

      setOpen(isOpen);
    },
    placement: "bottom-start",

    middleware: [offset(4), shift()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const click = useClick(context, { event: "mousedown" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    click,
  ]);

  const {
    getFloatingProps: getListFloatingProps,
    getReferenceProps: getInputProps,
    getItemProps,
    activeIndex,
    listRef,
  } = useSelectList({ context, open });

  const filteredOptions = search
    ? options.filter((option) =>
        extractLabel(option).toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  function disable() {
    onDisable?.();
    setOpen(false);
  }

  function selectOption(option: string) {
    if (selected.includes(option)) {
      setSelected(selected.filter((x) => x !== option));
    } else {
      onOptionSelected?.(option);
      setSelected([...selected, option]);
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.code === "Enter") {
      e.preventDefault();

      if (activeIndex !== null) {
        selectOption(extractKey(filteredOptions[activeIndex]));
      }
    }
  }

  const searchInput = (
    <input
      type="search"
      className={twMerge(
        Input,
        "block w-64 rounded-b-none",
        searchButton && "rounded-r-none",
      )}
      placeholder="Search..."
      autoFocus
      onChange={(e: FormEvent<HTMLInputElement>) =>
        setSearch(e.currentTarget.value)
      }
      {...getInputProps({
        onKeyDown: onInputKeyDown,
      })}
    />
  );

  return (
    <>
      <FilterChip
        ref={refs.setReference}
        active={open}
        onDisable={disable}
        showDownArrow
        {...rest}
        {...getReferenceProps()}
      />
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              className="overflow-hidden z-20 bg-white rounded-lg shadow"
              style={floatingStyles}
              ref={refs.setFloating}
              {...getFloatingProps(getListFloatingProps())}
            >
              {searchButton ? (
                <div className="flex w-full rounded-t">
                  {searchInput} {searchButton}
                </div>
              ) : (
                searchInput
              )}
              <SelectList
                isLoading={isLoading}
                isEmpty={filteredOptions.length === 0}
                className="overflow-y-auto max-h-64"
              >
                {filteredOptions.map((option, index) => {
                  const key = extractKey(option);

                  return (
                    <SelectOption
                      key={key}
                      isSelected={selected.includes(key)}
                      isActive={activeIndex === index}
                      ref={(el) => (listRef.current[index] = el)}
                      {...getItemProps({
                        // To prevent blur on search input
                        onMouseDown: (e) => e.preventDefault(),
                        onClick: () => selectOption(key),
                      })}
                    >
                      {extractLabel(option)}
                    </SelectOption>
                  );
                })}
              </SelectList>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
