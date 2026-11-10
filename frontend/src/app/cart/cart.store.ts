import { computed, inject, Injectable, signal } from '@angular/core';
import { CartItem, CartLine, Catalog, Product } from '../core/catalog.models';

import { CatalogApi } from '../core/catalog.api';
import { Subscription } from 'rxjs';

const storageKey = 'cris-angela/carrito/v1';
export const maxQuantity = 99;
const maxLines = 100;

function sameItem(a: CartItem, b: CartItem): boolean {
  return a.id === b.id && a.choices.length === b.choices.length &&
    a.choices.every((choice, i) => choice === b.choices[i]);
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly api = inject(CatalogApi);
  private restoreRequest?: Subscription;
  readonly restoring = signal(false);
  readonly restoreError = signal(false);
  private readonly items = signal<CartItem[]>([]);
  private readonly products = new Map<string, Product>();
  private readonly themes = new Map<string, string>();
  readonly lines = computed(() => this.items().flatMap((item): CartLine[] => {
    const product = this.products.get(item.id);
    if (!product || product.opciones.length !== item.choices.length ||
        !product.opciones.every((group, i) => group.valores.includes(item.choices[i]))) return [];
    return [{
      ...item,
      product,
      theme: this.themes.get(product.categoria) ?? '',
      variant: item.choices.map((choice, i) => `${product.opciones[i].nombre}: ${choice}`).join(' · '),
      subtotal: product.precio * item.quantity,
    }];
  }));
  readonly count = computed(() => this.items().reduce((count, item) => count + item.quantity, 0));
  readonly total = computed(() => this.lines().reduce((total, line) => total + line.subtotal, 0));

  initialize(catalog: Catalog) {
    this.themes.clear();
    catalog.productos.forEach((product) => this.products.set(product.id, product));
    catalog.categorias.forEach((category) => this.themes.set(category.id, category.tema));
    this.items.update(items => [...items]);
  }

  sync(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) this.restore();
  }

  add(product: Product, choices: string[]): string {
    this.products.set(product.id, product);
    const candidate = { id: product.id, choices, quantity: 1 };
    const previous = this.items().find((item) => sameItem(item, candidate));
    if (previous) {
      if (previous.quantity === maxQuantity) return 'Ya tienes 99 unidades de esta variante.';
      this.change(previous, 1);
    } else {
      if (this.items().length >= maxLines) return 'El carrito admite 100 productos o variantes diferentes.';
      this.save([...this.items(), candidate]);
    }
    return `${product.nombre} se agregó al carrito.`;
  }

  change(line: CartItem, delta: number) {
    this.save(this.items().map((item) => sameItem(item, line)
      ? { ...item, quantity: Math.min(maxQuantity, Math.max(1, item.quantity + delta)) }
      : item));
  }

  remove(line: CartItem) {
    this.save(this.items().filter((item) => !sameItem(item, line)));
  }

  payload(): CartItem[] {
    return this.items();
  }

  restore() {
    this.restoreRequest?.unsubscribe();
    this.restoreError.set(false);
    let stored: unknown;
    try { stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]'); }
    catch { stored = []; }
    const candidates: CartItem[] = [];
    if (Array.isArray(stored)) {
      for (const item of stored) {
        if (!item || typeof item.id !== 'string' || item.id.length > 64 || !Array.isArray(item.choices) ||
            !item.choices.every((choice: unknown) => typeof choice === 'string') ||
            !Number.isInteger(item.quantity) || item.quantity < 1) continue;
        const candidate = { id: item.id, choices: item.choices, quantity: Math.min(maxQuantity, item.quantity) };
        if (!candidates.some(line => sameItem(line, candidate))) candidates.push(candidate);
        if (candidates.length === maxLines) break;
      }
    }
    this.items.set(candidates);
    if (!candidates.length) { this.restoring.set(false); return; }
    this.restoring.set(true);
    this.restoreRequest = this.api.getSelection([...new Set(candidates.map(item => item.id))]).subscribe({
      next: result => {
        // Register only the requested cart products; a page change never discards the cart.
        const requested = new Set(candidates.map(item => item.id));
        requested.forEach(id => this.products.delete(id));
        result.productos.forEach(product => this.products.set(product.id, product));
        this.items.update(items => items.filter(item => {
          const product = this.products.get(item.id);
          return product && product.opciones.length === item.choices.length &&
            product.opciones.every((group, i) => group.valores.includes(item.choices[i]));
        }));
        this.restoring.set(false);
      },
      error: () => { this.restoring.set(false); this.restoreError.set(true); },
    });
  }

  private save(items: CartItem[]) {
    this.items.set(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // El carrito sigue disponible mientras la página esté abierta.
    }
  }
}
