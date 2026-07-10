"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function ActivityChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="label"
            stroke="#8B92A3"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis stroke="#8B92A3" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(10,11,13,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(255,85,51,0.08)" }}
          />
          <Bar dataKey="value" fill="#FF5533" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
