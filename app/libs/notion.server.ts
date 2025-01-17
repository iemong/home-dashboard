import { Client } from "@notionhq/client";
import { subDays, startOfDay, formatISO, format } from "date-fns";
import type { ChildCareLog } from "./child-care-log";
import type { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const client = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const getDatabase = async () => {
  const now = new Date();
  const today = startOfDay(now);
  const oneWeekAgo = subDays(today, 6); // 6 days ago to get 7 days total (including today)
  
  
  const response = await client.databases.query({
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          or: [
            {
              property: "Kind",
              select: {
                equals: "ミルク",
              },
            },
            {
              property: "Kind",
              select: {
                equals: "おっぱい",
              },
            },
          ],
        },
        {
          property: "Registered time",
          date: {
            after: formatISO(oneWeekAgo),
          },
        },
      ],
    },
  });
  const logs = (response.results as DatabaseObjectResponse[]).map(result => result.properties) as unknown as ChildCareLog[];
  
  const grouped = Object.groupBy(logs, (log) => {
    const date = new Date(log["Registered time"].date.start);
    return format(date, 'yyyy-MM-dd'); // Group by YYYY-MM-DD
  });
  
  const valuesByDate = Object.fromEntries(Object.entries(grouped).map(([date, logs]) => {
    const quantityPerKind = {
      milk: logs?.filter(log => log.Kind.select?.name === "ミルク")
                .reduce((sum, log) => sum + log.Quantity.number, 0) ?? 0,
      breastMilk: logs?.filter(log => log.Kind.select?.name === "おっぱい")
                  .reduce((sum, log) => sum + log.Quantity.number, 0) ?? 0
    };
    return [date, quantityPerKind];
  }));
  
  return valuesByDate;
}
