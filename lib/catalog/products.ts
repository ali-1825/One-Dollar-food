export interface CatalogProduct {
  name: string;
  pricePkr: number;
}

export const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  'double-dollar-smash': { name: 'Double Dollar Smash', pricePkr: 1 },
  'inferno-chicken': { name: 'Inferno Chicken', pricePkr: 1 },
  'garden-gremlin': { name: 'Garden Gremlin', pricePkr: 1 },
  'the-wake-up': { name: 'The Wake Up', pricePkr: 1 },
  'neon-crinkles': { name: 'Neon Crinkles', pricePkr: 1 },
  'gold-dust': { name: 'Gold Dust', pricePkr: 1 },
  radioactive: { name: 'Radioactive', pricePkr: 1 },
  'turbo-cola': { name: 'Turbo Cola', pricePkr: 1 },
  'zest-bomb': { name: 'Zest Bomb', pricePkr: 1 },
  'cocoa-cloud': { name: 'Cocoa Cloud', pricePkr: 1 },
  'iced-shook': { name: 'Iced Shook', pricePkr: 1 },
  'custom-order': { name: 'Custom Website Order', pricePkr: 1 }
};

export function resolveCatalogItem(itemId: string): CatalogProduct | null {
  const catalogItem = PRODUCT_CATALOG[itemId];
  if (catalogItem) {
    return catalogItem;
  }

  if (itemId.startsWith('classic-beef-burger-')) {
    const hasBacon = itemId.toLowerCase().includes('bacon');
    return {
      name: 'Classic Beef Burger',
      pricePkr: hasBacon ? 1.5 : 1
    };
  }

  return null;
}
