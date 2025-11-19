import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <div className="flex-1 p-4 sm:p-6 w-full">
        {/* Welcome Section Skeleton */}
        <div className="mb-6 sm:mb-8 px-2 sm:px-4 animate-slide-up">
          <Skeleton className="h-8 sm:h-10 w-64 mb-3 rounded-lg" />
          <Skeleton className="h-4 sm:h-5 w-96 rounded-lg" />
        </div>

        {/* Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start px-2 sm:px-4">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 w-full space-y-6">
            {/* Submit Work Section Skeleton */}
            <div className="border border-border/50 p-5 sm:p-7 bg-gradient-card rounded-2xl shadow-modern backdrop-blur-sm animate-slide-up">
              <Skeleton className="h-7 sm:h-8 w-48 mb-5 rounded-lg" />
              <Skeleton className="h-24 w-full mb-5 rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Courses Section Skeleton */}
            <div className="border border-border/50 p-5 sm:p-7 bg-gradient-card rounded-2xl shadow-modern backdrop-blur-sm animate-slide-up">
              <Skeleton className="h-7 sm:h-8 w-56 mb-5 sm:mb-6 rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-border/50 bg-white/80 rounded-xl backdrop-blur-sm shadow-modern">
                    <Skeleton className="h-20 w-full mb-4 rounded-t-xl" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border/50 p-4 sm:p-5 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <Skeleton className="h-5 w-28 mb-4 sm:mb-5 rounded-lg" />
                <Skeleton className="h-4 w-full mb-2 rounded-md" />
                <Skeleton className="h-4 w-4/5 mb-4 sm:mb-5 rounded-md" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LabsPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <Skeleton className="h-8 sm:h-10 w-32 mb-5 sm:mb-7 rounded-lg animate-slide-up" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Courses Sidebar Skeleton */}
          <div className="animate-slide-up">
            <Skeleton className="h-5 w-24 mb-4 sm:mb-5 rounded-lg" />
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          </div>
          {/* Labs List Skeleton */}
          <div className="lg:col-span-3 space-y-3 animate-slide-up">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-white to-accent/20 p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-gradient-card border border-border/50 p-6 sm:p-8 lg:p-10 rounded-2xl shadow-modern-xl backdrop-blur-sm">
          <Skeleton className="h-8 sm:h-9 w-48 mb-4 sm:mb-5 rounded-lg" />
          <Skeleton className="h-4 w-full mb-2 rounded-md" />
          <Skeleton className="h-4 w-5/6 mb-6 sm:mb-8 rounded-md" />
          <Skeleton className="h-12 w-full mb-4 sm:mb-5 rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-border/50 bg-gradient-card rounded-xl p-4 shadow-modern backdrop-blur-sm animate-fade-in">
      <Skeleton className="h-5 w-3/4 mb-3 rounded-lg" />
      <Skeleton className="h-4 w-full mb-2 rounded-md" />
      <Skeleton className="h-4 w-2/3 rounded-md" />
    </div>
  );
}

