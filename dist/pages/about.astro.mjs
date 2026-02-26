import { c as createComponent, r as renderComponent, a as renderTemplate, u as unescapeHTML } from '../chunks/astro/server_DLS59Yd3.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_B64J4OB_.mjs';
export { renderers } from '../renderers.mjs';

const html = () => "<h1 id=\"about-the-chronicle\">About The Chronicle</h1>\n<p>This project, “The Chronicle of Franklin Baldo,” is an experiment in automated personal documentation. It aims to transform Franklin Baldo’s public digital activities into a cohesive, contextualized, and searchable narrative, published as a blog.</p>\n<p>The system monitors public data sources (like GitHub, X/Twitter, and Manifold Markets), identifies significant events, and uses a chain of AI agents (initially powered by Google’s Gemini API) to draft, edit, and verify articles. The entire process is orchestrated via GitHub Actions, treating content creation as a CI/CD pipeline.</p>\n<p>This project is not just about content automation; it’s about creating a living digital legacy: a dynamic and interactive record of an individual’s intellectual, professional, and speculative evolution. It’s an experiment in narrative self-quantification, designed to be useful not only for human readers but also as a unique training dataset for future AIs.</p>\n<p>For more details on the architecture and philosophy behind this project, please refer to the <a href=\"/blog/documento-conceitual-a-cronica-de-franklin-baldo/\">Conceptual Document</a>.</p>";

				const frontmatter = {"title":"About","layout":"../layouts/Layout.astro"};
				const file = "/workspace/.tmp/franklin-blog/src/pages/about.md";
				const url = "/about";
				function rawContent() {
					return "   \n            \n                               \n   \n\n# About The Chronicle\n\nThis project, \"The Chronicle of Franklin Baldo,\" is an experiment in automated personal documentation. It aims to transform Franklin Baldo's public digital activities into a cohesive, contextualized, and searchable narrative, published as a blog.\n\nThe system monitors public data sources (like GitHub, X/Twitter, and Manifold Markets), identifies significant events, and uses a chain of AI agents (initially powered by Google's Gemini API) to draft, edit, and verify articles. The entire process is orchestrated via GitHub Actions, treating content creation as a CI/CD pipeline.\n\nThis project is not just about content automation; it's about creating a living digital legacy: a dynamic and interactive record of an individual's intellectual, professional, and speculative evolution. It's an experiment in narrative self-quantification, designed to be useful not only for human readers but also as a unique training dataset for future AIs.\n\nFor more details on the architecture and philosophy behind this project, please refer to the [Conceptual Document](/blog/documento-conceitual-a-cronica-de-franklin-baldo/).";
				}
				async function compiledContent() {
					return await html();
				}
				function getHeadings() {
					return [{"depth":1,"slug":"about-the-chronicle","text":"About The Chronicle"}];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${renderComponent(result, 'Layout', $$Layout, {
								file,
								url,
								content,
								frontmatter: content,
								headings: getHeadings(),
								rawContent,
								compiledContent,
								'server:root': true,
							}, {
								'default': () => renderTemplate`${unescapeHTML(html())}`
							})}`;
				});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content,
	compiledContent,
	default: Content,
	file,
	frontmatter,
	getHeadings,
	rawContent,
	url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
