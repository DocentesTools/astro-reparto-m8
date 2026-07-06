"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export interface RepartoFkOption {
  value: string;
  label: string;
}

export interface RepartoFkSelectLabels {
  placeholder: string;
  createNew: string;
  loading: string;
  noResults: string;
}

export interface RepartoFkSelectProps {
  value: string;
  options: RepartoFkOption[];
  labels: RepartoFkSelectLabels;
  loading?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (value: string) => void;
  renderInlineCreate?: (onDone: (newId: string) => void) => React.ReactNode;
}

const CREATE_NEW_SENTINEL = "__create_new__";

export function RepartoFkSelect({
  disabled,
  disabledReason,
  labels,
  loading = false,
  onChange,
  options,
  renderInlineCreate,
  value
}: RepartoFkSelectProps) {
  const [creating, setCreating] = useState(false);

  function handleValueChange(next: string) {
    if (next === CREATE_NEW_SENTINEL) {
      setCreating(true);
      return;
    }
    onChange(next);
  }

  return (
    <div className="space-y-2" data-reparto-fk-select="">
      <Select disabled={disabled || loading} value={value || undefined} onValueChange={handleValueChange}>
        <SelectTrigger aria-label={labels.placeholder} aria-disabled={disabled}>
          <SelectValue placeholder={labels.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="p-2 text-sm text-muted-foreground" data-reparto-fk-state="loading">
              {labels.loading}
            </div>
          ) : options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground" data-reparto-fk-state="empty">
              {labels.noResults}
            </div>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
          {renderInlineCreate ? (
            <SelectItem value={CREATE_NEW_SENTINEL} data-reparto-fk-action="create-new">
              {labels.createNew}
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      {disabled && disabledReason ? (
        <p className="text-xs text-muted-foreground" data-reparto-disabled-reason="">
          {disabledReason}
        </p>
      ) : null}
      {renderInlineCreate && creating ? (
        <Dialog open onOpenChange={(open) => { if (!open) setCreating(false); }}>
          <DialogTrigger asChild>
            <span className="hidden" />
          </DialogTrigger>
          <DialogContent data-reparto-inline-create="">
            <DialogHeader>
              <DialogTitle>{labels.createNew}</DialogTitle>
            </DialogHeader>
            {renderInlineCreate((newId) => {
              setCreating(false);
              onChange(newId);
            })}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
