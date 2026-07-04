export interface BreadcrumbItem {
  name: string;
  href: string;
}

/** Maps a page's breadcrumb trail (relative hrefs) to the {name, item} shape
 *  PageLayout's `breadcrumb` prop expects for BreadcrumbList JSON-LD — the
 *  same trail feeds both the visible <Breadcrumbs> UI and the structured data. */
export function toBreadcrumbLd(
  items: BreadcrumbItem[],
  site?: URL
): Array<{ name: string; item: string }> {
  return items.map((item) => ({
    name: item.name,
    item: site ? new URL(item.href, site).href : item.href,
  }));
}
