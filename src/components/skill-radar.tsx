"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Skill } from "@/lib/types";

export function SkillRadar({ skills }: { skills: Skill[] }) {
  const data = skills.map((s) => ({
    subject: s.name.length > 9 ? `${s.name.slice(0, 8)}…` : s.name,
    level: s.level,
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-64 w-full max-w-full overflow-hidden" aria-label="Radar chart of skill levels">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#c9bc9a" strokeDasharray="4 4" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#6d6450", fontSize: 11, fontFamily: "var(--font-quicksand)", fontWeight: 700 }}
          />
          <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
          <Radar
            dataKey="level"
            stroke="#6e7f4f"
            strokeWidth={2}
            fill="#8ba05e"
            fillOpacity={0.45}
            isAnimationActive={false}
          />
          <Tooltip
            formatter={(v) => [`Lv. ${v}`, null]}
            contentStyle={{
              background: "#faf6ea",
              border: "1px solid #c9bc9a",
              borderRadius: 12,
              fontSize: 12,
              color: "#35301f",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
