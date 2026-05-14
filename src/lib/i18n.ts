export type Lang = 'en' | 'pt';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.archive': 'Archive',
    'nav.tags': 'Tags',
    'nav.projects': 'Projects',
    'nav.search': 'Search',
    'nav.about': 'About',
    'post.continueReading': 'Continue reading →',
    'post.minutesRead': 'min read',
    'post.updated': 'updated',
    'post.tags': 'Tags:',
    'post.partOf': 'Part',
    'post.of': 'of',
    'post.inSeries': 'in the',
    'post.series': 'series.',
    'post.allInSeries': 'All posts in this series',
    'post.thisPost': 'this post',
    'post.readInLang': 'Read in Portuguese',
    'lang.label': 'PT',
    'lang.switchLabel': 'Ler em Português',
    'lang.noTranslation': 'Sem versão em português',
  },
  pt: {
    'nav.home': 'Início',
    'nav.archive': 'Arquivo',
    'nav.tags': 'Tags',
    'nav.projects': 'Projetos',
    'nav.search': 'Buscar',
    'nav.about': 'Sobre',
    'post.continueReading': 'Continuar lendo →',
    'post.minutesRead': 'min de leitura',
    'post.updated': 'atualizado',
    'post.tags': 'Tags:',
    'post.partOf': 'Parte',
    'post.of': 'de',
    'post.inSeries': 'na série',
    'post.series': '.',
    'post.allInSeries': 'Todos os posts desta série',
    'post.thisPost': 'este post',
    'post.readInLang': 'Read in English',
    'lang.label': 'EN',
    'lang.switchLabel': 'Read in English',
    'lang.noTranslation': 'No English version',
  },
} as const;

export type UIKey = keyof typeof ui.en;

export function t(lang: Lang, key: UIKey): string {
  return ui[lang][key];
}

export function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('lang');
  if (stored === 'en' || stored === 'pt') return stored;
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
