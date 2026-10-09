import * as zod from 'zod';

export const chartJsSchema = zod.object({
  type: zod.enum([
    'pie',
    'bar',
    'line',
    'bubble',
    'doughnut',
    'polarArea',
    'radar',
    'scatter',
  ]),
  data: zod.object({
    labels: zod.array(zod.union([zod.string(), zod.number()])).optional(),
    xLabels: zod.array(zod.union([zod.string(), zod.number()])).optional(),
    yLabels: zod.array(zod.union([zod.string(), zod.number()])).optional(),
    datasets: zod.array(
      zod.object({
        label: zod.string().optional(),
        data: zod.array(
          zod.union([
            zod.number(),
            zod.object({
              x: zod.number(),
              y: zod.number(),
              r: zod.number().optional(), // for bubble charts
            }),
          ]),
        ),
        backgroundColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
        borderColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
        borderWidth: zod.number().optional(),
        fill: zod.boolean().optional(),
        tension: zod.number().optional(), // for line charts
        pointRadius: zod.number().optional(),
        pointBackgroundColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
        hoverBackgroundColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
        hoverBorderColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
      }),
    ),
  }),
});
