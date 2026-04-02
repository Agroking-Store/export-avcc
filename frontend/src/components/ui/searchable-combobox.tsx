"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  data: any[];
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange: (search: string) => void;
  displayField: string;
  valueField: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export function SearchableCombobox({
  data,
  value,
  onValueChange,
  onSearchChange,
  displayField,
  valueField,
  placeholder,
  searchPlaceholder,
  emptyMessage = "No results found.",
  loading = false,
  disabled = false,
  error = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const getDisplayValue = () => {
    const selectedItem = data.find((item) => item[valueField] === value);
    return selectedItem ? selectedItem[displayField] : placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-12 justify-between cursor-pointer border-gray-300 shadow-sm",
            !value && "text-muted-foreground",
            error && "border-red-500"
          )}
        >
          <span className="truncate">{getDisplayValue()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && data.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item[valueField]}
                  value={`${item[displayField]} ${item[valueField]}`}
                  onSelect={() => {
                    onValueChange(
                      item[valueField] === value ? "" : item[valueField]
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item[valueField] ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item[displayField]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
