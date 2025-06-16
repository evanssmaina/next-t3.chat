import { availableModels } from "@/ai/providers";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function ProvidersSelect({
  selectedModel,
  setSelectedModel,
}: {
  selectedModel: string;
  setSelectedModel: (value: string | ((val: string) => string)) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = availableModels.find(
    (model) => model.id === selectedModel,
  );

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return <Icons.gemini className="size-4" />;
      case "xai":
        return <Icons.github className="size-4" />; // Using twitter icon for xAI
      default:
        return <div className="size-4 rounded bg-gray-300" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="max-w-fit rounded-lg border-none justify-between"
        >
          <div className="flex items-center gap-2">
            {currentModel && getProviderIcon(currentModel.provider)}
            <span>{currentModel?.name || "Select a model"}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="p-2">
          <div className="space-y-1">
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 p-2 rounded-md hover:bg-muted/40 text-left transition-colors ${
                  selectedModel === model.id ? "bg-muted/50" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-0.5 bg-muted  p-2 rounded-lg">
                  {getProviderIcon(model.provider)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
