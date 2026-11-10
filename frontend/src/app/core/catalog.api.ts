import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Catalog, CatalogQuery, Order, Product, ProductPage, Quote } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);

  getCatalog() {
    return this.http.get<Catalog>('/api/catalogo');
  }

  getProducts(query: CatalogQuery) {
    let params = new HttpParams().set('page', query.page);
    if (query.category) params = params.set('categoria', query.category);
    if (query.search.trim()) params = params.set('q', query.search.trim());
    if (query.sort) params = params.set('orden', query.sort);
    const [min, max] = query.range.split(':');
    if (min) params = params.set('min', min);
    if (max) params = params.set('max', max);
    return this.http.get<ProductPage>('/api/productos', { params });
  }

  getSelection(ids: string[]) {
    let params = new HttpParams();
    ids.forEach(id => params = params.append('ids[]', id));
    return this.http.get<{ productos: Product[] }>('/api/productos/seleccion', { params });
  }

  quote(order: Order) {
    return this.http.post<Quote>('/api/pedidos/cotizar', order);
  }
}
