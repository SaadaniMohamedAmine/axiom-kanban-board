"use client";

interface EmptyBoardStateProps {
  onCreateTask?: () => void;
}

export function EmptyBoardState({ onCreateTask }: EmptyBoardStateProps) {
  return (
    <div className="flex-1 px-container-padding pb-8 overflow-x-auto">
      <div className="flex h-full gap-gutter min-w-max relative">
        {/* Column placeholders */}
        <div className="w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline"></span>
              <span className="text-label-md uppercase tracking-widest text-on-surface-variant">To Do</span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant">0</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" x2="12" y1="5" y2="19"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
            </button>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/30"></div>
        </div>

        <div className="w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-label-md uppercase tracking-widest text-on-surface-variant">In Progress</span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant">0</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" x2="12" y1="5" y2="19"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
            </button>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/30"></div>
        </div>

        <div className="w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-label-md uppercase tracking-widest text-on-surface-variant">Review</span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant">0</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" x2="12" y1="5" y2="19"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
            </button>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/30"></div>
        </div>

        <div className="w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-label-md uppercase tracking-widest text-on-surface-variant">Done</span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant">0</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" x2="12" y1="5" y2="19"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
            </button>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/30"></div>
        </div>

        {/* Centered Empty State Message */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="relative w-64 h-64 mb-8 flex items-center justify-center pointer-events-auto group">
            <div className="absolute inset-0 bg-radial-gradient from-tertiary/15 to-secondary-container/10 blur-[40px] animate-pulse-slow"></div>
            <div className="relative z-20 w-48 h-48 bg-surface-container-high border border-outline-variant/30 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-2 gap-4 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                <div className="w-12 h-1 bg-primary rounded-full"></div>
                <div className="w-8 h-1 bg-tertiary rounded-full ml-auto"></div>
                <div className="w-6 h-1 bg-secondary rounded-full"></div>
                <div className="w-10 h-1 bg-outline rounded-full ml-auto"></div>
                <div className="w-14 h-1 bg-primary-container rounded-full"></div>
                <div className="w-12 h-1 bg-tertiary rounded-full ml-auto"></div>
              </div>
              <svg className="absolute text-[64px] text-on-surface/10 group-hover:text-primary/20 transition-all duration-700" fill="none" height="64" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" viewBox="0 0 24 24" width="64" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            </div>
          </div>
          <div className="text-center space-y-4 pointer-events-auto">
            <h3 className="text-h2 text-on-surface font-semibold tracking-tight">
              Nothing here yet — let&apos;s start your first sprint.
            </h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
              Create tasks to track progress, collaborate with your team, and ship faster with Axiom.
            </p>
            <div className="pt-6">
              <button
                onClick={onCreateTask}
                className="relative bg-surface-bright/20 border border-primary/30 px-8 py-3 rounded-xl text-label-md font-bold text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 group overflow-hidden"
              >
                <span className="relative z-10">Create First Task</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
