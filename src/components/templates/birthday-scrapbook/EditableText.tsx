import { useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { setText, useText } from "@/lib/scrapbook-store";

type Props = {
  id: string;
  defaultValue: string;
  className?: string;
  multiline?: boolean;
  as?: "span" | "p" | "h2" | "h3" | "div";
};

export function EditableText({
  id,
  defaultValue,
  className,
  multiline = false,
  as = "span",
}: Props) {
  const value = useText(id, defaultValue);
  const ref = useRef<HTMLElement | null>(null);
  const Tag = as as "span";

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== value) el.innerText = value;
  }, [value]);

  return (
    <span className={cn("group/edit relative max-w-full", multiline ? "inline" : "inline-block")}>
      <Tag
        ref={ref as never}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label="Editable text"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        onBlur={(e) => {
          const next = (e.currentTarget as HTMLElement).innerText.replace(/\n{3,}/g, "\n\n");
          if (next.trim() !== value) setText(id, next.trim() === "" ? defaultValue : next);
        }}
        className={cn(
          "cursor-text rounded-[2px] outline-none transition-shadow",
          multiline && "whitespace-pre-line",
          "focus:shadow-[0_0_0_2px_var(--pin-red)]",
          className,
        )}
      >
        {value}
      </Tag>
      <Pencil
        aria-hidden
        className="pointer-events-none absolute -right-4 top-0 h-3 w-3 opacity-0 transition-opacity group-hover/edit:opacity-60"
      />
    </span>
  );
}
