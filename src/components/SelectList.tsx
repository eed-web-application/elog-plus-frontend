import { ComponentPropsWithoutRef, forwardRef } from "react";
import Spinner from "./Spinner";

export interface Props extends ComponentPropsWithoutRef<"div"> {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
}

const SelectList = forwardRef<HTMLDivElement, Props>(function SelectList(
  { isLoading, isEmpty, emptyLabel, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} {...rest}>
      {isEmpty || isLoading ? (
        <div className="py-3 w-full text-center text-gray-500">
          {isLoading ? (
            <Spinner className="m-auto" />
          ) : (
            emptyLabel || "No options"
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
});

export default SelectList;
