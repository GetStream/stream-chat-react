import * as zod from 'zod';

export const chartJsSchema = zod.object({
  data: zod.object({
    datasets: zod.array(
      zod.object({
        backgroundColor: zod.union([zod.string(), zod.array(zod.string())]).optional(),
        borderColor: zod.union([zod.string(), zod.array(zod.string())]).optional(),
        borderWidth: zod.number().optional(),
        data: zod.array(
          zod.union([
            zod.number(),
            zod.object({
              r: zod.number().optional(), // for bubble charts
              x: zod.number(),
              y: zod.number(),
            }),
          ]),
        ),
        fill: zod.boolean().optional(),
        hoverBackgroundColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
        hoverBorderColor: zod.union([zod.string(), zod.array(zod.string())]).optional(),
        label: zod.string().optional(),
        pointBackgroundColor: zod
          .union([zod.string(), zod.array(zod.string())])
          .optional(),
        pointRadius: zod.number().optional(),
        tension: zod.number().optional(), // for line charts
      }),
    ),
    labels: zod.array(zod.union([zod.string(), zod.number()])).optional(),
    xLabels: zod.array(zod.union([zod.string(), zod.number()])).optional(),
    yLabels: zod.array(zod.union([zod.string(), zod.number()])).optional(),
  }),
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
});
