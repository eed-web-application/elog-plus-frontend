import { ComponentPropsWithoutRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const SelectOption = forwardRef<
  HTMLDivElement,
  {
    isActive?: boolean;
    isSelected?: boolean;
    className?: string;
  } & ComponentPropsWithoutRef<"div">
>(function SelectOption({ isActive, isSelected, className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isActive}
      className={twMerge(
        "w-full text-left block px-2 p-1 cursor-pointer hover:bg-gray-100",
        isActive && "bg-gray-100",
        isSelected && "bg-blue-100 hover:bg-blue-200",
        isSelected && isActive && "bg-blue-200",
        className,
      )}
      {...rest}
    />
  );
});

export default SelectOption;
