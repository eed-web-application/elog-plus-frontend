import { ComponentPropsWithoutRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const SelectOption = forwardRef<
  HTMLButtonElement,
  {
    isActive?: boolean;
    isSelected?: boolean;
    className?: string;
  } & ComponentPropsWithoutRef<"button">
>(function Option({ isActive, isSelected, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      role="option"
      className={twMerge(
        "w-full text-left block px-2 p-1 cursor-pointer hover:bg-gray-100",
        isActive && "bg-gray-100",
        isSelected && "bg-blue-100 hover:bg-blue-200",
        isSelected && isActive && "bg-blue-200",
        className
      )}
      aria-selected={isActive && isSelected}
      tabIndex={isActive ? 0 : -1}
      {...rest}
    />
  );
});

export default SelectOption;
