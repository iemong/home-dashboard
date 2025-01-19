import { Client } from "@notionhq/client";
import { subDays, startOfDay, formatISO, format, subHours } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { ChildCareLog } from "./child-care-log";
import type { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const client = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const getChildCareTotalsByDate = async () => {
  const now = toZonedTime(new Date(), 'Asia/Tokyo');
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
    const date = toZonedTime(new Date(log["Registered time"].date.start), 'Asia/Tokyo');
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

export const getTodayChildCareLogs = async () => {
  const now = toZonedTime(new Date(), 'Asia/Tokyo');
  const now2 = new Date();
  const todayStart = startOfDay(now); 
  const todayStart2 = startOfDay(now2);
  const todayStart3 = fromZonedTime(todayStart, 'Asia/Tokyo')
  console.log(formatISO(todayStart), todayStart.toISOString(), formatISO(now), now.toISOString())
  console.log(formatISO(todayStart2), todayStart2.toISOString(), formatISO(now2), now2.toISOString())
  console.log(formatISO(todayStart3), todayStart3.toISOString())
  
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
            on_or_after: todayStart.toISOString(),
          },
        },
      ],
    },
  });

  return (response.results as DatabaseObjectResponse[]).map(result => result.properties) as unknown as ChildCareLog[];
}

export const getLastMilkTime = async () => {
  const response = await client.databases.query({
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: "Kind",
      select: {
        equals: "ミルク",
      },
    },
    sorts: [
      {
        property: "Registered time",
        direction: "descending",
      },
    ],
    page_size: 1,
  });

  if (response.results.length === 0) {
    return null;
  }

  const result = response.results[0] as DatabaseObjectResponse;
  const properties = result.properties as unknown as ChildCareLog;
  const registeredTime = properties["Registered time"].date?.start;
  
  if (!registeredTime) {
    return null;
  }
  
  return toZonedTime(new Date(registeredTime), 'Asia/Tokyo');
}
