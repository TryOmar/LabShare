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
        <h2 className="text-xl font-bold text-black mb-4">Last Updates</h2>
      )}
      <div className="space-y-2.5">
        {updatesToShow.map((update, index) => {
          const suggestedBy = normalizeToArray(update.suggestedBy);
          const implementedBy = normalizeToArray(update.implementedBy);
          const isSamePerson = areSamePeople(suggestedBy, implementedBy);
          
          return (
            <div 
              key={index} 
              className="border-b border-gray-200 pb-2.5 last:border-b-0 last:pb-0"
            >
              <div className="mb-1.5">
                <h3 className="font-semibold text-black text-xs leading-snug">
                  {update.feature}
                </h3>
              </div>
              <div className="text-[10px] text-gray-600 leading-tight">
                {isSamePerson ? (
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="break-words">{formatNames(suggestedBy)}</span>
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    <span className="whitespace-nowrap flex-shrink-0">{update.date}</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="break-words">
                      <span className="font-medium">Suggested:</span> {formatNames(suggestedBy)}
                    </div>
                    <div className="break-words">
                      <span className="font-medium">Implemented:</span> {formatNames(implementedBy)}
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

