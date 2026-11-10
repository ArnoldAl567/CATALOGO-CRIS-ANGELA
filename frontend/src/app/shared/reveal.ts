import { AfterViewInit, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[storeReveal]' })
export class Reveal implements AfterViewInit {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly destroy = inject(DestroyRef);

  ngAfterViewInit() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      this.element.nativeElement.animate(
        [{ opacity: 0.3, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }],
        { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      observer.disconnect();
    }, { threshold: 0.1 });
    observer.observe(this.element.nativeElement);
    this.destroy.onDestroy(() => observer.disconnect());
  }
}
