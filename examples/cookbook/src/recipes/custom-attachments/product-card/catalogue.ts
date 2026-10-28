import type { Product } from './product';

/** The products the picker offers. An app would load them from its shop. */
export const catalogue: Product[] = [
  {
    currency: 'EUR',
    id: 'glass-teapot',
    imageUrl: 'https://picsum.photos/id/225/480/360',
    price: 34,
    title: 'Glass teapot',
    url: 'https://example.com/shop/glass-teapot',
  },
  {
    currency: 'EUR',
    id: 'honey-jar',
    imageUrl: 'https://picsum.photos/id/312/480/360',
    price: 9.5,
    title: 'Honey jar',
    url: 'https://example.com/shop/honey-jar',
  },
  {
    currency: 'EUR',
    id: 'sprinkled-doughnut',
    imageUrl: 'https://picsum.photos/id/488/480/360',
    price: 3.5,
    title: 'Sprinkled doughnut',
    url: 'https://example.com/shop/sprinkled-doughnut',
  },
];
