import { lastUpdates } from "@/data/lastUpdates";

interface LastUpdatesProps {
  showTitle?: boolean;
  maxItems?: number;
}

// Helper function to normalize string or array to array
function normalizeToArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

// Helper function to format names array for display
function formatNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  // For multiple names, return as comma-separated list
  return names.join(", ");
}

// Helper function to check if two arrays contain the same people (order-independent)
function areSamePeople(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, index) => val === sorted2[index]);
}

export default function LastUpdates({ showTitle = false, maxItems }: LastUpdatesProps) {
  const updatesToShow = maxItems ? lastUpdates.slice(0, maxItems) : lastUpdates;

  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-xl font-bold text-foreground mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Last Updates</h2>
      )}
      <div className="space-y-3">
        {updatesToShow.map((update, index) => {
          const suggestedBy = normalizeToArray(update.suggestedBy);
          const implementedBy = normalizeToArray(update.implementedBy);
          const isSamePerson = areSamePeople(suggestedBy, implementedBy);
          
          return (
            <div 
              key={index} 
              className="border-b border-border/30 pb-3 last:border-b-0 last:pb-0 animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="mb-2">
                <h3 className="font-semibold text-foreground text-xs leading-snug">
                  {update.feature}
                </h3>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {isSamePerson ? (
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="break-words">{formatNames(suggestedBy)}</span>
                    <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                    <span className="whitespace-nowrap flex-shrink-0">{update.date}</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="break-words">
                      <span className="font-medium text-foreground">Suggested:</span> {formatNames(suggestedBy)}
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-foreground">Implemented:</span> {formatNames(implementedBy)}
                    </div>
                    <div className="whitespace-nowrap mt-0.5">{update.date}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

