import { getSql } from "@/lib/database";

export type AnalyticsMetrics = {
  daily: Array<{ day: string; activeActors: number }>;
  mau: number;
};

export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const sql = getSql();
  const [dailyResult, monthlyResult] = await Promise.all([
    sql`
      SELECT
        to_char((created_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT actor_key)::int AS active_actors
      FROM analytics_events
      WHERE created_at >= now() - interval '30 days'
      GROUP BY (created_at AT TIME ZONE 'UTC')::date
      ORDER BY day ASC
    `,
    sql`
      SELECT COUNT(DISTINCT actor_key)::int AS active_actors
      FROM analytics_events
      WHERE created_at >= now() - interval '30 days'
    `,
  ]);
  const daily = dailyResult as unknown as Array<{ day: string; active_actors: number }>;
  const monthly = monthlyResult as unknown as Array<{ active_actors: number }>;

  return {
    daily: daily.map(({ day, active_actors }) => ({ day, activeActors: active_actors })),
    mau: monthly[0]?.active_actors ?? 0,
  };
}
