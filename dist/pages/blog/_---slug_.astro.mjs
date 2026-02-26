import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../chunks/astro/server_DLS59Yd3.mjs';
import 'piccolore';
import { g as getCollection } from '../../chunks/_astro_content_DHjRGdTC.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B64J4OB_.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://franklinbaldo.github.io");
async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post }
  }));
}
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const { post } = Astro2.props;
  const { Content } = await post.render();
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": post.data.title, "description": post.data.description, "image": post.data.heroImage }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="max-w-2xl mx-auto py-8 font-serif leading-relaxed animate-fade-in"> <header class="mb-12 text-center md:text-left border-b border-[#2a2b36] pb-8 relative"> <div class="absolute top-0 right-0 text-[10rem] opacity-[0.01] font-serif font-bold text-[#ff9e64] pointer-events-none select-none -z-10 transform translate-x-1/4 -translate-y-1/4"> ${new Date(post.data.date).getFullYear()} </div> <div class="mb-6"> <time${addAttribute(post.data.date.toISOString(), "datetime")} class="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-4 inline-block"> ${formatDate(post.data.date)} </time> <h1 class="text-5xl md:text-6xl font-bold text-[#e0e0e0] leading-tight mb-6 tracking-tight"> ${post.data.title} </h1> </div> <div class="flex gap-6 items-center text-sm font-mono text-gray-500 justify-center md:justify-start"> ${post.data.author && renderTemplate`<span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-[#ff9e64]"></span>By ${post.data.author}</span>`} <span class="opacity-50">|</span> <span>${(post.body.length / 500).toFixed(0)} min read</span> </div> </header> <div class="markdown-content text-lg"> ${renderComponent($$result2, "Content", Content, {})} </div> <div class="mt-16 pt-8 border-t border-[#2a2b36] flex justify-between items-center text-sm font-mono text-gray-500"> <a href="/" class="hover:text-[#ff9e64] transition-colors flex items-center gap-2"> <span>&larr;</span> Back to Timeline
</a> <span class="opacity-50">End of Entry</span> </div> </article> ` })} `;
}, "/workspace/.tmp/franklin-blog/src/pages/blog/[...slug].astro", void 0);

const $$file = "/workspace/.tmp/franklin-blog/src/pages/blog/[...slug].astro";
const $$url = "/blog/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
