"use client";

// Adapted from shadcn/ui (MIT): https://ui.shadcn.com/r/styles/new-york-v4/radio-group.json
// Retains Radix semantics; replaces shadows/transitions with AnyMD's flat tokens.
import type { ComponentProps } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

function RadioGroup({
  className = "",
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={`radio-group ${className}`}
      {...props}
    />
  );
}
function RadioGroupItem({
  className = "",
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={`radio-group-item ${className}`}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="radio-group-indicator"
      >
        <CircleIcon aria-hidden="true" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
export { RadioGroup, RadioGroupItem };
