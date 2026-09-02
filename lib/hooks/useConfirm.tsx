"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function confirm(opts: ConfirmOptions): Promise<boolean> {
    setOptions(opts);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }

  function handleConfirm() {
    resolver?.(true);
    setOptions(null);
    setIsLoading(false);
  }

  function handleCancel() {
    resolver?.(false);
    setOptions(null);
    setIsLoading(false);
  }

  const dialog = options ? (
    <ConfirmDialog
      open={true}
      title={options.title}
      description={options.description}
      confirmLabel={options.confirmLabel}
      danger={options.danger}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, dialog };
}