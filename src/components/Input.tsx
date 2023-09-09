export type TextProps = {
  value: string;
  onChange: (newValue: string) => void;
};

export type SelectProps = {
  options: string[];
  getOptionLabel: (option: string) => string;
  value: string | null;
  onChange: (selected: string | null) => void;
  onOptionSelected?: (option: string) => void;
};

export type MultiSelectOptionProps<O> = {
  options: O[];
  getOptionLabel: (option: O) => string;
  value: O[];
  onChange: (selected: O[]) => void;
  onOptionSelected?: (option: O) => void;
};

export type MultiSelectProps<C> = {
  isLoading?: boolean;
} & (
  | ({ allowCustomOptions?: false } & MultiSelectOptionProps<string>)
  | ({
      allowCustomOptions: true;
      canCreate: (query: string) => void;
      onCreate: (query: string) => void;
    } & MultiSelectOptionProps<string | C>)
);

export type InputProps<O> = {
  invald?: boolean;
  disabled?: boolean;
} & (
  | ({ type: "text" } & TextProps)
  | ({ type: "select" } & SelectProps)
  | ({ type: "multi-select" } & MultiSelectProps<O>)
);

function Select({ options, getOptionLabel, value, onChange }: SelectProps) {
  return null;
}

export default function Input() {}
