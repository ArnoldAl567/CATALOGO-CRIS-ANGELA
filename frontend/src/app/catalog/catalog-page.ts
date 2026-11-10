import { Component, computed, input, output } from '@angular/core';
import { CatalogQuery, Category, Product, ProductPage } from '../core/catalog.models';
import { ProductCard } from './product-card';

@Component({
  selector: 'store-catalog-page',
  imports: [ProductCard],
  templateUrl: './catalog-page.html',
})
export class CatalogPage {
  readonly categories = input.required<Category[]>();
  readonly query = input.required<CatalogQuery>();
  readonly result = input<ProductPage | null>(null);
  readonly loading = input(false);
  readonly error = input(false);
  readonly changed = output<Partial<CatalogQuery>>();
  readonly detail = output<Product>();
  readonly add = output<Product>();
  readonly retry = output<void>();
  readonly categoriesById = computed(() => new Map(this.categories().map(c => [c.id, c])));
  readonly title = computed(() => this.query().search ? 'Resultados de búsqueda' : this.categoriesById().get(this.query().category)?.nombre ?? 'Todos los productos');
  readonly pages = computed(() => {
    const last = this.result()?.paginas ?? 1;
    const current = this.result()?.pagina ?? 1;
    const selected = new Set([1, last, current - 1, current, current + 1]);
    const values = [...selected].filter(p => p >= 1 && p <= last).sort((a, b) => a - b);
    const pages: (number | string)[] = [];
    values.forEach((value, i) => {
      if (i && value - values[i - 1] > 1) pages.push(`gap-${value}`);
      pages.push(value);
    });
    return pages;
  });
  pageNumber(value: number | string): number { return Number(value); }
  isPage(value: number | string): boolean { return typeof value === 'number'; }
  filter(value: Partial<CatalogQuery>) { this.changed.emit({ ...value, page: 1 }); }
  clear() { this.filter({ category: '', search: '', range: '', sort: '' }); }
}
