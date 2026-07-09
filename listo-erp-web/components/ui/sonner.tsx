"use client"

import {
  CheckCircle,
  Info,
  SpinnerGap,
  Warning,
  XCircle,
} from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

export type ToastType = "default" | "success" | "error" | "warning" | "info"

export interface ShowToastOptions {
  type?: ToastType
  message: string
  description?: string
}

export function showToast({ type = "default", message, description }: ShowToastOptions) {
  const options = description ? { description } : undefined

  switch (type) {
    case "success":
      return toast.success(message, options)
    case "error":
      return toast.error(message, options)
    case "warning":
      return toast.warning(message, options)
    case "info":
      return toast.info(message, options)
    default:
      return toast(message, options)
  }
}

export function showToastPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  }
) {
  return toast.promise(promise, messages)
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme as "light" | "dark") ?? "system"}
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" weight="fill" />,
        info: <Info className="size-4" weight="fill" />,
        warning: <Warning className="size-4" weight="fill" />,
        error: <XCircle className="size-4" weight="fill" />,
        loading: <SpinnerGap className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success:
            "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success",
          error:
            "group-[.toaster]:bg-destructive group-[.toaster]:text-white group-[.toaster]:border-destructive",
          warning:
            "group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning",
          info: "group-[.toaster]:bg-info group-[.toaster]:text-info-foreground group-[.toaster]:border-info",
          description: "group-[.toaster]:text-inherit group-[.toaster]:opacity-80",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
