import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { CartDialog } from './cart/cart-dialog';
import { CartStore } from './cart/cart.store';
import { CatalogPage } from './catalog/catalog-page';
import { ProductDetail } from './catalog/product-detail';
import { HomePage } from './home/home-page';
import { CatalogApi } from './core/catalog.api';
import { categoryLink } from './core/catalog-format';
import { Catalog, CatalogQuery, Product, ProductPage } from './core/catalog.models';
import { StoreIcons } from './shared/store-icons';
import { Reveal } from './shared/reveal';

const emptyQuery = (): CatalogQuery => ({ category: '', search: '', range: '', sort: '', page: 1 });

@Component({
  selector: 'app-root',
  imports: [StoreIcons, HomePage, CatalogPage, ProductDetail, CartDialog, Reveal],
  templateUrl: './app.html',
  host: { '(window:hashchange)': 'restoreRoute()', '(window:storage)': 'cart.sync($event)' },
})
export class App implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly destroy = inject(DestroyRef);
  readonly cart = inject(CartStore);
  readonly catalog = signal<Catalog | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly view = signal<'home' | 'catalog'>('home');
  readonly query = signal<CatalogQuery>(emptyQuery());
  readonly searchDraft = signal('');
  readonly result = signal<ProductPage | null>(null);
  readonly productsLoading = signal(false);
  readonly productsError = signal(false);
  readonly selected = signal<Product | null>(null);
  readonly cartOpen = signal(false);
  readonly toast = signal('');
  readonly categoryLink = categoryLink;
  readonly year = new Date().getFullYear();
  readonly categoriesById = computed(() => new Map(this.catalog()?.categorias.map(item => [item.id, item])));
  private toastTimer?: number;
  private productsRequest?: Subscription;

  ngOnInit() {
    this.cart.restore();
    this.restoreRoute();
    this.load();
    this.destroy.onDestroy(() => { window.clearTimeout(this.toastTimer); this.productsRequest?.unsubscribe(); });
  }

  load() {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set(false);
    this.api.getCatalog().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: catalog => {
        this.catalog.set(catalog);
        this.cart.initialize(catalog);
        this.loading.set(false);
      },
      error: () => { this.loadError.set(true); this.loading.set(false); },
    });
  }

  loadProducts() {
    this.productsRequest?.unsubscribe();
    this.productsLoading.set(true);
    this.productsError.set(false);
    this.productsRequest = this.api.getProducts(this.query()).subscribe({
      next: result => {
        this.result.set(result);
        this.productsLoading.set(false);
        if (result.pagina !== this.query().page) {
          this.query.update(query => ({ ...query, page: result.pagina }));
          window.history.replaceState(null, '', this.queryUrl());
        }
      },
      error: () => { this.productsLoading.set(false); this.productsError.set(true); },
    });
  }

  addOrChoose(product: Product) {
    if (product.opciones.length) this.selected.set(product);
    else this.add(product, []);
  }
  add(product: Product, choices: string[]) {
    this.toast.set(this.cart.add(product, choices));
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2500);
  }
  navigate(event: MouseEvent, category = '') {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.openCatalog(category);
  }
  openCatalog(category = '') { this.changeQuery({ ...emptyQuery(), category }); }
  goHome(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.location.hash !== '#') window.history.pushState(null, '', '#');
    this.restoreRoute();
  }
  updateSearch(value: string) { this.searchDraft.set(value); }
  scrollToContent(event: MouseEvent) {
    event.preventDefault();
    const target = document.getElementById('contenido');
    target?.scrollIntoView({ block: 'start' });
    target?.focus({ preventScroll: true });
  }
  submitSearch(event: SubmitEvent) {
    event.preventDefault();
    this.changeQuery({ ...emptyQuery(), search: this.searchDraft().trim().slice(0, 120) });
  }
  changeQuery(change: Partial<CatalogQuery>) {
    this.query.update(query => ({ ...query, ...change }));
    this.searchDraft.set(this.query().search);
    this.view.set('catalog');
    if (window.location.hash !== this.queryUrl()) window.history.pushState(null, '', this.queryUrl());
    this.loadProducts();
    this.scrollToView();
  }
  private queryUrl() {
    const query = this.query();
    const params = new URLSearchParams();
    if (query.search) params.set('q', query.search);
    if (query.range) params.set('precio', query.range);
    if (query.sort) params.set('orden', query.sort);
    if (query.page > 1) params.set('pagina', String(query.page));
    return categoryLink(query.category) + (params.size ? '?' + params.toString() : '');
  }
  restoreRoute() {
    const [path, search = ''] = window.location.hash.split('?');
    if (path === '#catalogo' || path.startsWith('#catalogo/')) {
      const params = new URLSearchParams(search);
      const page = Number(params.get('pagina'));
      const range = params.get('precio') ?? '';
      const sort = params.get('orden') ?? '';
      this.query.set({ category: path.startsWith('#catalogo/') ? path.slice(10) : '',
        search: (params.get('q') ?? '').slice(0, 120),
        range: ['', '0:1200', '1201:1800', '1801:2500', '2501:'].includes(range) ? range : '',
        sort: ['asc', 'desc'].includes(sort) ? sort : '',
        page: Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1 });
      this.searchDraft.set(this.query().search);
      this.view.set('catalog');
      this.loadProducts();
      this.scrollToView();
    } else {
      this.productsRequest?.unsubscribe();
      this.view.set('home');
      this.searchDraft.set('');
      if (path !== '#categorias' && path !== '#contenido') this.scrollToView();
    }
  }
  private scrollToView() {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(this.view() === 'catalog' ? 'catalogo-titulo' : 'contenido');
      target?.scrollIntoView({ block: 'start' });
      if (this.view() === 'catalog') target?.focus({ preventScroll: true });
    });
  }
}
