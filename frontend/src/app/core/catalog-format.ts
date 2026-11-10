export const price = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;
export const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export const categoryLink = (id = '') => id ? `#catalogo/${id}` : '#catalogo';
