import { Component, computed, input, output } from '@angular/core';
import { Catalog, Product } from '../core/catalog.models';
import { categoryLink } from '../core/catalog-format';
import { ProductCard } from '../catalog/product-card';
import { Reveal } from '../shared/reveal';

@Component({
  selector: 'store-home-page',
  imports: [ProductCard, Reveal],
  templateUrl: './home-page.html',
})
export class HomePage {
  readonly catalog = input<Catalog | null>(null);
  readonly loading = input(false);
  readonly loadError = input(false);
  readonly browse = output<string>();
  readonly detail = output<Product>();
  readonly add = output<Product>();
  readonly retry = output<void>();
  readonly categoryLink = categoryLink;
  readonly categoriesById = computed(() => new Map(this.catalog()?.categorias.map(c => [c.id, c])));
  readonly featured = computed(() => {
    const products = new Map(this.catalog()?.productos.map(p => [p.id, p]));
    return (this.catalog()?.destacados ?? []).map(id => products.get(id)).filter((p): p is Product => !!p).slice(0, 4);
  });

  navigate(event: MouseEvent, category = '') {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.browse.emit(category);
  }

  showProduct(id: string) {
    const product = this.catalog()?.productos.find(p => p.id === id);
    if (product) this.detail.emit(product);
  }
}
