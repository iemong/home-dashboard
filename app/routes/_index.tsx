import type { Route } from "./+types/_index";
import type { ChildCareLog } from "~/libs/child-care-log";

interface LoaderData {
  weeklyTotals: Record<string, { milk: number; breastMilk: number }>;
  todayLogs: ChildCareLog[];
  lastMilkTime: Date | null;
}
import { getChildCareTotalsByDate, getTodayChildCareLogs, getLastMilkTime } from "~/libs/notion.server";
import { ChildCareLogList } from "~/components/ChildCareLogList";
import { compareAsc } from "date-fns";
import { useRevalidator } from "react-router";
import { useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type Align,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "赤ちゃんお食事ログ" },
    { name: "description", content: "赤ちゃんがおっぱいやミルクをどれだけ飲んだかを確認するページです。" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const [weeklyTotals, todayLogs, lastMilkTime] = await Promise.all([
    getChildCareTotalsByDate(),
    getTodayChildCareLogs(),
    getLastMilkTime()
  ]);
  
  return {
    weeklyTotals,
    todayLogs,
    lastMilkTime
  } as LoaderData;
}

function transformData(weeklyTotals: Record<string, { milk: number; breastMilk: number }>) {
  const sortedDates = Object.keys(weeklyTotals).sort((a, b) =>
    compareAsc(new Date(a), new Date(b))
  );
  const labels = sortedDates;
  const milkQuantities = sortedDates.map(date => weeklyTotals[date].milk);
  const breastMilkQuantities = sortedDates.map(date => weeklyTotals[date].breastMilk);

  return {
    labels,
    datasets: [
      {
        label: 'ミルク(ml)',
        data: milkQuantities,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        stack: 'combined',
      },
      {
        label: '母乳(ml)',
        data: breastMilkQuantities,
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        stack: 'combined',
      },
    ],
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { weeklyTotals, todayLogs, lastMilkTime } = loaderData ?? {
    weeklyTotals: {},
    todayLogs: [],
    lastMilkTime: null
  };
  const { revalidate } = useRevalidator();
  const chartData = transformData(weeklyTotals);

  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
    }, 60 * 1000 * 10); // 10 minutes

    return () => clearInterval(interval);
  }, [revalidate]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      datalabels: {
        display: true,
        color: '#000',
        anchor: 'center',
        align: 'center',
        formatter: (value: number) => value,
        font: {
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text:'飲んだ量 (ml)',
        },
        stacked: true,
      },
      x: {
        stacked: true,
      }
    }
  };

  return (
    <div className="flex gap-8 px-8 py-4">
      <div className="flex-1">
        <div className="max-w-[800px]">
          <h2 className="text-xl font-bold mb-4">1週間の授乳量</h2>
          {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
          <Bar options={options as any} data={chartData} />
        </div>
        <div>
        {lastMilkTime && (
          <div className="mt-8 py-6 px-6 bg-gray-50 flex justify-center items-center flex-col rounded-full border w-fit">
            <h3 className="font-semibold mb-2">最後にミルクを飲んだ時間</h3>
            <p className="text-xl font-bold">
              {new Date(lastMilkTime).toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}
            </p>
          </div>
        )}
        </div>
      </div>
      <ChildCareLogList logs={todayLogs} />
    </div>
  );
}
