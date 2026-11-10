import { AfterViewInit, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { Category, Product } from '../core/catalog.models';
import { price } from '../core/catalog-format';
import { closeOnBackdrop } from '../shared/dialog-backdrop';

@Component({
  selector: 'store-product-detail',
  templateUrl: './product-detail.html',
})
export class ProductDetail implements AfterViewInit {
  readonly product = input.required<Product>();
  readonly category = input<Category>();
  readonly add = output<{ product: Product; choices: string[] }>();
  readonly closed = output<void>();
  readonly photo = signal(0);
  readonly zoomed = signal(false);
  readonly price = price;
  readonly closeOnBackdrop = closeOnBackdrop;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }

  submit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const product = this.product();
    const choices = product.opciones.map((_, i) => String(data.get(`variante-${i}`) ?? ''));
    if (!product.opciones.every((group, i) => group.valores.includes(choices[i]))) return;
    this.add.emit({ product, choices });
    this.dialog().nativeElement.close();
  }
}
