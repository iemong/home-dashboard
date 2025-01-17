import type { Route } from "./+types/_index";
import { getChildCareTotalsByDate, getTodayChildCareLogs } from "~/libs/notion.server";
import { ChildCareLogList } from "~/components/ChildCareLogList";
import { compareAsc } from "date-fns";
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
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const [weeklyTotals, todayLogs] = await Promise.all([
    getChildCareTotalsByDate(),
    getTodayChildCareLogs()
  ]);
  
  return {
    weeklyTotals,
    todayLogs
  };
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
  const { weeklyTotals, todayLogs } = loaderData ?? { weeklyTotals: {}, todayLogs: [] };
  const chartData = transformData(weeklyTotals);

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
      <div className="max-w-[800px] flex-1">
        <h2 className="text-xl font-bold mb-4">1週間の授乳量</h2>
        {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
        <Bar options={options as any} data={chartData} />
      </div>
      <ChildCareLogList logs={todayLogs} />
    </div>
  );
}
