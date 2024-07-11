import { twJoin, twMerge } from "tailwind-merge";
import { Draft } from "../../draftsStore";
import { Checkbox, Input, InputInvalid } from "../base";
import Select from "../Select";
import { Shift } from "../../api";

export interface Props {
  value: Draft["summarizes"];
  onChange: (value: Draft["summarizes"]) => void;
  shifts: Shift[];
  onShiftNameBlur: () => void;
  onDateBlur: () => void;
  invalidShiftName?: boolean;
  invalidDate?: boolean;
  disabled?: boolean;
}

export default function ShiftSummaryForm({
  value,
  onChange,
  shifts,
  onShiftNameBlur,
  onDateBlur,
  invalidShiftName,
  invalidDate,
  disabled,
}: Props) {
  return (
    <>
      <label
        className={twMerge(
          "text-gray-500 mb-1 flex items-center w-fit",
          disabled && "text-gray-400",
        )}
      >
        <input
          type="checkbox"
          className={twJoin(Checkbox, "mr-2")}
          checked={value.checked}
          disabled={disabled}
          onChange={() => onChange({ ...value, checked: !value.checked })}
        />
        Shift summary
      </label>
      <div className="flex gap-3 mb-2">
        <Select
          placeholder="Shift"
          required
          containerClassName="block w-full"
          className="w-full"
          options={shifts.map(({ name, id }) => ({
            label: name,
            value: id,
          }))}
          value={value.shiftId}
          setValue={(shift) => onChange({ ...value, shiftId: shift || "" })}
          invalid={invalidShiftName}
          onBlur={onShiftNameBlur}
          disabled={disabled || !value.checked}
        />
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.currentTarget.value })}
          className={twMerge(
            Input,
            invalidDate && InputInvalid,
            "block w-full",
          )}
          onBlur={onDateBlur}
          disabled={disabled || !value.checked}
        />
      </div>
    </>
  );
}
