import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "./Input"

export interface SearchInputProps {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute start-2.5 top-2 h-4 w-4 text-body" />
      <Input
        type="search"
        className={`ps-9 w-64 ${className || ''}`}
        {...props}
      />
    </div>
  )
}
