
import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface MultiSelectProps {
  options: { value: string; label: string; color?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxOptions?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  className,
  maxOptions = 10,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      if (selected.length < maxOptions) {
        onChange([...selected, value]);
      }
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap min-h-10 items-center gap-1 border rounded-md px-3 py-2 text-sm",
          isOpen ? "border-ring" : "border-input",
          selected.length === 0 && "text-muted-foreground"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span>{placeholder}</span>
        ) : (
          selected.map((value) => {
            const option = options.find((o) => o.value === value);
            return (
              <Badge
                key={value}
                variant="secondary"
                style={{
                  backgroundColor: option?.color || undefined,
                  color: option?.color
                    ? getBrightness(option.color) > 128
                      ? "#000"
                      : "#fff"
                    : undefined,
                }}
              >
                {option?.label || value}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => handleRemove(value, e)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </button>
              </Badge>
            );
          })
        )}
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-md">
          <div className="max-h-52 overflow-auto">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer flex items-center gap-2",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  {option.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selected.length >= maxOptions && isOpen && (
        <div className="absolute z-10 mt-1 w-full text-center text-xs text-destructive bg-background p-1 border-t border-input">
          Limite máximo de {maxOptions} seleções atingido
        </div>
      )}
    </div>
  );
}

// Função para calcular o brilho de uma cor e decidir se o texto deve ser preto ou branco
function getBrightness(color: string): number {
  // Remove # se presente
  const hex = color.replace("#", "");
  
  // Converte hex para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calcula o brilho (fórmula padrão)
  return (r * 299 + g * 587 + b * 114) / 1000;
}
