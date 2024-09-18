import {
  ComponentPropsWithRef,
  ElementType,
  forwardRef,
  JSXElementConstructor,
} from "react";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "./Spinner";

type IntrinsicAttributes<
  E extends
    | keyof JSX.IntrinsicElements
    | JSXElementConstructor<Record<string, unknown>>,
> = JSX.LibraryManagedAttributes<E, ComponentPropsWithRef<E>>;

interface OwnProps<E extends ElementType = ElementType> {
  as?: E;
  variant?: keyof typeof variants;
  state?: "neutral" | "selected" | "highlighted";
  isLoading?: boolean;
}

export type Props<E extends ElementType> = OwnProps<E> &
  Omit<IntrinsicAttributes<E>, keyof OwnProps>;

const iconStates = {
  neutral: "hover:bg-gray-200 focus:bg-gray-200",
  selected: "hover:bg-blue-200 focus:bg-blue-200",
  highlighted: "hover:bg-yellow-300 focus:bg-yellow-300",
};

const iconBase =
  "hover:bg-gray-200 focus:bg-gray-200 cursor-pointer select-none disable:hover:bg-transparent disable:focus:bg-transparent disable:cursor-auto outline-none";

const variants = {
  button:
    "cursor-pointer py-1 px-2 bg-blue-500 rounded-lg text-white border border-blue-500 hover:bg-blue-600 hover:border-blue-600 outline-2 focus:outline outline-blue-300 outline-offset-0 disabled:cursor-auto disabled:bg-blue-300 disabled:border-blue-300 disabled:hover:bg-blue-300 disabled:text-gray-100",
  text: "cursor-pointer py-1 px-2 rounded-lg font-medium text-blue-500 hover:bg-blue-100 disabled:hover:bg-transparent disabled:text-blue-200",
  iconSmall: twJoin("w-10 h-10 p-2.5 rounded-full", iconBase),
  icon: twJoin("w-10 h-10 p-2 rounded-full", iconBase),
  iconLarge: twJoin("w-8 h-8 p-1 rounded-full", iconBase),
  iconSquare: twJoin("w-9 h-9 p-1 rounded", iconBase),
};

const Button = forwardRef(function Button<E extends ElementType>(
  { as, className, variant, state, isLoading, children, ...rest }: Props<E>,
  ref: ComponentPropsWithRef<E>["ref"],
) {
  const Component = as ?? "button";

  let buttonClassName = variants[variant ?? "button"];

  if (variant?.startsWith("icon")) {
    if (state === "selected") {
      buttonClassName = twMerge(buttonClassName, iconStates.selected);
    } else if (state === "highlighted") {
      buttonClassName = twMerge(buttonClassName, iconStates.highlighted);
    } else {
      buttonClassName = twMerge(buttonClassName, iconStates.neutral);
    }
  }

  return (
    <Component
      ref={ref}
      className={twMerge(buttonClassName, isLoading && "relative", className)}
      {...rest}
    >
      {isLoading ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="tiny" />
          </div>
          <div className="invisible">{children}</div>
        </>
      ) : (
        children
      )}
    </Component>
  );
}) as <E extends ElementType = "button">(props: Props<E>) => JSX.Element;

export default Button;
