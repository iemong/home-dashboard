import { Client } from "@notionhq/client";
import { subDays, startOfDay, formatISO, format, subHours, addHours, differenceInDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { ChildCareLog } from "./child-care-log";
import type { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const TIME_ZONE = "Asia/Tokyo";

const client = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const getChildCareTotalsByDate = async () => {
  const now = toZonedTime(new Date(), TIME_ZONE);
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
    const date = toZonedTime(new Date(log["Registered time"].date.start), TIME_ZONE);
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
  const now = toZonedTime(new Date(), TIME_ZONE);
  const todayStart = startOfDay(now); 
  const todayStartUtc = fromZonedTime(todayStart, TIME_ZONE)
  
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
            on_or_after: todayStartUtc.toISOString(),
          },
        },
      ],
    },
  });

  return (response.results as DatabaseObjectResponse[]).map(result => result.properties) as unknown as ChildCareLog[];
}

export const getNextMilkTime = async () => {
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
  
  return addHours(new Date(registeredTime), 3);
}

export const getLatestWeight = async () => {
  const response = await client.databases.query({
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: "Kind",
      select: {
        equals: "体重",
      },
    },
    sorts: [
      {
        property: "Registered time",
        direction: "descending",
      },
    ],
    page_size: 1
  });

  if (response.results.length === 0) {
    return null;
  }

  const result = response.results[0] as DatabaseObjectResponse;
  const properties = result.properties as unknown as ChildCareLog;
  
  // 出生時の体重
  const birthWeight = 3440;
  // 誕生日
  const birthDate = new Date('2024-12-18');
  
  const currentWeight = properties.Quantity.number;
  const registeredTime = properties["Registered time"].date?.start;
  
  if (!registeredTime) {
    return null;
  }
  
  const registeredDate = toZonedTime(new Date(registeredTime), TIME_ZONE);
  
  // 誕生日からの経過日数を計算（date-fnsのdifferenceInDaysを使用）
  const daysSinceBirth = differenceInDays(registeredDate, birthDate);
  
  // 体重の増加量
  const weightGain = currentWeight - birthWeight;
  
  // 1日あたりの増加量
  const dailyGain = daysSinceBirth > 0 ? Math.round((weightGain / daysSinceBirth) * 10) / 10 : 0;
  
  return {
    currentWeight,
    weightGain,
    dailyGain,
    daysSinceBirth,
    registeredDate: format(registeredDate, 'yyyy/MM/dd'),
  };
}
