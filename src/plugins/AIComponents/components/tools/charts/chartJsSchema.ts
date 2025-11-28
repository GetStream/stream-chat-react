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
    labels: zod.array(zod.string()).optional(),
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
  options: zod
    .object({
      responsive: zod.boolean().optional(),
      maintainAspectRatio: zod.boolean().optional(),
      aspectRatio: zod.number().optional(),
      plugins: zod
        .object({
          title: zod
            .object({
              display: zod.boolean().optional(),
              text: zod.string().optional(),
              align: zod.enum(['start', 'center', 'end']).optional(),
              font: zod
                .object({
                  size: zod.number().optional(),
                  weight: zod.union([zod.string(), zod.number()]).optional(),
                  family: zod.string().optional(),
                })
                .optional(),
            })
            .optional(),
          legend: zod
            .object({
              display: zod.boolean().optional(),
              position: zod.enum(['top', 'left', 'bottom', 'right']).optional(),
            })
            .optional(),
          tooltip: zod
            .object({
              enabled: zod.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
      scales: zod
        .object({
          x: zod
            .object({
              display: zod.boolean().optional(),
              title: zod
                .object({
                  display: zod.boolean().optional(),
                  text: zod.string().optional(),
                })
                .optional(),
              grid: zod
                .object({
                  display: zod.boolean().optional(),
                })
                .optional(),
            })
            .optional(),
          y: zod
            .object({
              display: zod.boolean().optional(),
              title: zod
                .object({
                  display: zod.boolean().optional(),
                  text: zod.string().optional(),
                })
                .optional(),
              grid: zod
                .object({
                  display: zod.boolean().optional(),
                })
                .optional(),
              beginAtZero: zod.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});
