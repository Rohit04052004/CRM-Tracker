"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function Combobox({
  value,
  onChange,
  allLabel,
  options,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = value === "All" ? allLabel : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal sm:w-auto",
          className
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={allLabel}
                data-checked={value === "All"}
                onSelect={() => {
                  onChange("All");
                  setOpen(false);
                }}
              >
                {allLabel}
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o}
                  value={o}
                  data-checked={value === o}
                  onSelect={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                >
                  {o}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
