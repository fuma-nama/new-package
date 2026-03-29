"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva } from "class-variance-authority";
import { cnState } from "@/lib/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectIcon = SelectPrimitive.Icon;
export const SelectList = SelectPrimitive.List;
export const SelectItemText = SelectPrimitive.ItemText;

const selectTriggerStyles = cva(
  "flex w-full items-center justify-between rounded-fe border border-fe-border bg-fe-input px-3 py-2 text-sm text-fe-foreground outline-none transition-colors hover:border-fe-ring focus-visible:border-fe-ring",
);

const selectPopupStyles = cva(
  "z-50 min-w-(--anchor-width) rounded-fe border border-fe-border bg-fe-popover p-1 text-fe-popover-foreground shadow-2xl",
);

const selectItemStyles = cva(
  "flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm text-fe-muted-foreground outline-none data-highlighted:bg-fe-accent data-highlighted:text-fe-accent-foreground data-selected:font-medium data-selected:text-fe-foreground",
);

type SelectTriggerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;
type SelectPopupProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Popup>;
type SelectPositionerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>;
type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

export function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger className={cnState(selectTriggerStyles(), className)} {...props} />
  );
}

interface SelectContentProps extends SelectPopupProps {
  sideOffset?: number;
  align?: SelectPositionerProps["align"];
}

export function SelectContent({ sideOffset = 6, align, className, ...props }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={sideOffset} align={align}>
        <SelectPrimitive.Popup className={cnState(selectPopupStyles(), className)} {...props} />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, ...props }: SelectItemProps) {
  return <SelectPrimitive.Item className={cnState(selectItemStyles(), className)} {...props} />;
}
