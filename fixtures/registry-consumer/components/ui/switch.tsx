import * as React from "react";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ checked: _checked, onCheckedChange: _onCheckedChange, ...props }: SwitchProps) {
  return <button type="button" role="switch" {...props} />;
}
