import type { ChildCareLog } from "~/libs/child-care-log";

interface ChildCareLogListProps {
  logs: ChildCareLog[];
}

export function ChildCareLogList({ logs }: ChildCareLogListProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">今日の記録</h2>
      <div className="divide-y divide-gray-200">
        {logs.map((log) => (
          <div key={log["Childcare id"].unique_id.number} className="p-2">
            <div className="flex justify-between items-center gap-12 text-sm text-gray-600">
              <p>
                {new Date(log["Registered time"].date.start).toLocaleTimeString('ja-JP', { timeStyle: 'short' })}
              </p>
              <div className="flex gap-2 items-center">
                <p>{log.Kind.select?.name}</p>
                <p className="w-[3em] text-right">
                  {log.Quantity.number}ml
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}