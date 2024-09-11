import TimePicker from "react-time-picker";
import "./TimeInput.css";
import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export interface Props extends ComponentPropsWithoutRef<typeof TimePicker> {
  invalid?: boolean;
}

export default function TimeInput({
  className,
  disabled,
  invalid,
  ...rest
}: Props) {
  return (
    <TimePicker
      format="HH:mm"
      disableClock
      disabled={disabled}
      className={twMerge(
        disabled && "disabled",
        invalid && "invalid",
        className,
      )}
      clearIcon={null}
      {...rest}
    />
  );
}
