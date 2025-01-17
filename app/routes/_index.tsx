import type { Route } from "./+types/_index";
import { getDatabase } from "~/libs/notion.server";
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
  const res = await getDatabase();
  return res;
}

function transformData(valuesByDate: Record<string, { milk: number; breastMilk: number }>) {
  const sortedDates = Object.keys(valuesByDate).sort((a, b) => 
    compareAsc(new Date(a), new Date(b))
  );
  const labels = sortedDates;
  const milkQuantities = sortedDates.map(date => valuesByDate[date].milk);
  const breastMilkQuantities = sortedDates.map(date => valuesByDate[date].breastMilk);

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
  const valuesByDate = loaderData ?? {};
  const chartData = transformData(valuesByDate);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '一週間の授乳量',
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
      <Bar options={options as any} data={chartData} />
    </div>
  );
}
