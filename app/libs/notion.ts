import { Client } from "@notionhq/client";
import type { ChildCareLog } from "./child-care-log";
import type { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const client = new Client({
  auth: import.meta.env.VITE_NOTION_TOKEN,
})

export const getDatabase = async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0); // Set to start of day
  
  const response = await client.databases.query({
    database_id: import.meta.env.VITE_NOTION_DATABASE_ID,
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
            after: oneWeekAgo.toISOString(),
          },
        },
      ],
    },
  });
  const logs = (response.results as DatabaseObjectResponse[]).map(result => result.properties) as unknown as ChildCareLog[];
  
  const grouped = Object.groupBy(logs, (log) => {
    const date = new Date(log["Registered time"].date.start);
    return date.toISOString().split('T')[0]; // Group by YYYY-MM-DD
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
