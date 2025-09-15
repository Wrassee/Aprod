import { Progress } from '@/components/ui/progress';

type ProtocolHeaderProps = {
  logoSrc: string;
  title: string;
  progressLabel: string;
  progressPercent: number;
  rightContent?: React.ReactNode;
};

export function ProtocolHeader({
  logoSrc,
  title,
  progressLabel,
  progressPercent,
  rightContent,
}: ProtocolHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img src={logoSrc} alt="OTIS Logo" className="h-12 w-12 mr-4" />
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          {rightContent}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-blue-700">{progressLabel}</span>
          <div className="flex-1 px-4">
            <Progress value={progressPercent} className="h-2.5" />
          </div>
          <span className="text-sm font-medium text-blue-700">{Math.round(progressPercent)}%</span>
        </div>
      </div>
    </header>
  );
}