import { formatDayLabel } from "@/lib/analytics/format";

export type ChartSeries = { label: string; color: string };
export type ChartPoint = { date: string; values: number[] };

const WIDTH = 840;
const HEIGHT = 240;
const PAD_LEFT = 62;
const PAD_RIGHT = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 30;

const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Столбчатый график с общей осью. Одна серия — обычные столбцы,
 * несколько — сгруппированные (новые / повторные покупатели).
 */
export function BarChartCard({
  title,
  data,
  series,
  formatValue
}: {
  title: string;
  data: ChartPoint[];
  series: ChartSeries[];
  formatValue: (value: number) => string;
}) {
  const rawMax = Math.max(0, ...data.flatMap((point) => point.values));
  const max = niceMax(rawMax);
  const hasData = rawMax > 0;

  const slot = data.length > 0 ? PLOT_W / data.length : PLOT_W;
  const groupGap = Math.min(slot * 0.25, 6);
  const innerWidth = Math.max(slot - groupGap, 1);
  const barWidth = Math.max(innerWidth / series.length, 0.8);

  // Не более ~9 подписей на оси X, иначе они сливаются
  const labelStep = Math.max(1, Math.ceil(data.length / 9));
  const gridValues = [0, max / 2, max];

  return (
    <div className="card" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="mono" style={{ fontSize: 11 }}>{title}</div>
        {series.length > 1 ? (
          <div style={{ display: "flex", gap: 14 }}>
            {series.map((s) => (
              <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2 }} />
                {s.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {!hasData ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          Нет данных за выбранный период
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: "100%", height: "auto", overflow: "visible" }}
          role="img"
          aria-label={title}
        >
          {gridValues.map((value) => {
            const y = PAD_TOP + PLOT_H - (value / max) * PLOT_H;
            return (
              <g key={value}>
                <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} stroke="var(--border)" strokeWidth={1} />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {formatValue(value)}
                </text>
              </g>
            );
          })}

          {data.map((point, index) =>
            series.map((s, seriesIndex) => {
              const value = point.values[seriesIndex] ?? 0;
              const height = value > 0 ? Math.max((value / max) * PLOT_H, 1.5) : 0;
              const x = PAD_LEFT + index * slot + seriesIndex * barWidth;
              const y = PAD_TOP + PLOT_H - height;
              return (
                <rect
                  key={`${point.date}-${s.label}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill={s.color}
                  rx={barWidth > 4 ? 1.5 : 0}
                >
                  <title>{`${formatDayLabel(point.date)} · ${s.label}: ${formatValue(value)}`}</title>
                </rect>
              );
            })
          )}

          {data.map((point, index) =>
            index % labelStep === 0 ? (
              <text
                key={`label-${point.date}`}
                x={PAD_LEFT + index * slot + innerWidth / 2}
                y={HEIGHT - PAD_BOTTOM + 18}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={10}
                fontFamily="monospace"
              >
                {formatDayLabel(point.date)}
              </text>
            ) : null
          )}

          <line
            x1={PAD_LEFT}
            y1={PAD_TOP + PLOT_H}
            x2={WIDTH - PAD_RIGHT}
            y2={PAD_TOP + PLOT_H}
            stroke="var(--border)"
            strokeWidth={1}
          />
        </svg>
      )}
    </div>
  );
}
