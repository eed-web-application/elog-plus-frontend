import { twMerge } from "tailwind-merge";
import {
  ComponentPropsWithRef,
  PropsWithChildren,
  ReactNode,
  forwardRef,
} from "react";
import { MouseEvent } from "react";

export interface Props extends Omit<ComponentPropsWithRef<"button">, "label"> {
  label: ReactNode;
  enabled?: boolean;
  showCheck?: boolean;
  showDownArrow?: boolean;
  onDisable?: (e: MouseEvent<SVGSVGElement>) => void;
  className?: string;
}

/**
 * Generic filter chip.
 * See https://m3.material.io/components/chips/overview.
 */
const FilterChip = forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(
  (
    { label, enabled, showCheck, showDownArrow, onDisable, className, ...rest },
    ref
  ) => {
    function disable(e: MouseEvent<SVGSVGElement>) {
      e.stopPropagation();
      onDisable?.(e);
    }

    return (
      <button
        ref={ref}
        type="button"
        className={twMerge(
          "flex items-center text-gray-500 border rounded-2xl px-3 bg-gray-50 border-gray-300 hover:bg-gray-200 hover:border-gray-400",
          showCheck && enabled && "pl-2",
          ((onDisable && !enabled) || (showDownArrow && enabled)) && "pr-2",
          enabled &&
            "bg-blue-100 border-blue-100 hover:bg-blue-200 hover:border-blue-200",
          className
        )}
        {...rest}
      >
        {showCheck && enabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        )}
        <div className="py-1 whitespace-nowrap">{label}</div>
        {onDisable && enabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ml-1 w-8 h-8 p-1 hover:bg-blue-300 rounded-full"
            onClick={disable}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        {showDownArrow && !enabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="ml-2 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        )}
      </button>
    );
  }
);

export default FilterChip;
