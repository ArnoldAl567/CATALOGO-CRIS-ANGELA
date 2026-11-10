import { Component, input, output } from '@angular/core';
import { Category, Product } from '../core/catalog.models';
import { price } from '../core/catalog-format';

@Component({
  selector: 'store-product-card',
  templateUrl: './product-card.html',
  host: { class: 'product-card' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly category = input<Category>();
  readonly aboveFold = input(false);
  readonly detail = output<Product>();
  readonly add = output<Product>();
  readonly price = price;
}
