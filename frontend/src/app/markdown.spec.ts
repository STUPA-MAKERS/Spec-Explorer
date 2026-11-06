import { provideRouter } from '@angular/router';
import { render } from '@testing-library/angular';
import { MarkdownViewComponent } from '@stupa-makers/ui-kit/markdown-view';

describe('Markdown of a spec', () => {
  it('noRawHtml: renders no raw HTML; links are http, https or relative (§NF/security/content/000031)', async () => {
    const src = [
      '<script>alert(1)</script> <img src=x onerror=alert(1)>',
      '[a](javascript:alert(1)) [b](mailto:a@b.de) [c](https://example.org) [d](/STUPA-Workflow/main)',
    ].join('\n\n');
    const { container } = await render(MarkdownViewComponent, {
      inputs: { src, imageSrc: null, mailto: false },
      providers: [provideRouter([])],
    });
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['https://example.org', '/STUPA-Workflow/main']);
    expect(container.textContent).toContain('<script>');
  });
});
