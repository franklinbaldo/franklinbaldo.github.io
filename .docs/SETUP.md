# Franklin Baldo - Personal Website
 
[![Deploy MkDocs to GitHub Pages](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/workflows/deploy.yml)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![MkDocs Material](https://img.shields.io/badge/MkDocs%20Material-526CFE?style=for-the-badge&logo=MaterialForMkDocs&logoColor=white)

> **Personal website and digital chronicle of Franklin Baldo's thoughts, projects, and intellectual journey in Legal Tech, AI/ML, and software development.**

🌐 **Live Site**: [https://franklinbaldo.github.io](https://franklinbaldo.github.io)

## 🔥 Features

- ✅ **MkDocs Material** - Beautiful, responsive design
- ✅ **Blog System** - Markdown-based blog posts with automatic indexing
- ✅ **Dark/Light Mode** - Theme switcher built-in
- ✅ **Search** - Full-text search functionality
- ✅ **SEO Optimized** - Meta tags, social cards, and structured data
- ✅ **RSS Feed** - Automatic RSS generation
- ✅ **Git Integration** - Shows last updated dates from Git history
- ✅ **Auto-Deploy** - GitHub Actions deployment to GitHub Pages

## 🚀 Project Structure

```
franklinbaldo.github.io/
├── docs/                       # Content directory
│   ├── index.md               # Homepage
│   ├── about.md               # About page
│   └── blog/                  # Blog section
│       ├── index.md           # Blog index
│       └── posts/             # Blog posts
│           ├── 2024-07-12-documento-conceitual-a-cronica-de-franklin-baldo.md
│           ├── 2024-07-12-patents-for-social-vulnerabilities.md
│           ├── 2024-07-12-pontifex-architecture-implementation-guide.md
│           ├── 2024-07-12-pontifex-novel-architecture-semantic-probing.md
│           ├── 2024-07-12-will-ai-discover-new-conservation-law-before-2050.md
│           └── 2025-02-02-inaugural-post-a-glimpse-inside-my-mind.md
├── .github/workflows/          # GitHub Actions
│   └── deploy.yml             # Auto-deployment workflow
├── mkdocs.yml                 # MkDocs configuration
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🛠 Tech Stack

- **Framework**: [MkDocs](https://www.mkdocs.org/) with [Material theme](https://squidfunk.github.io/mkdocs-material/)
- **Language**: Python 3.11+
- **Deployment**: GitHub Actions → GitHub Pages
- **Content**: Markdown with extended syntax support
- **Features**: Blog plugin, search, social cards, Git integration

## 💻 Local Development

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/franklinbaldo/franklinbaldo.github.io.git
   cd franklinbaldo.github.io
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start development server**:
   ```bash
   mkdocs serve
   ```

4. **Open in browser**: http://localhost:8000

### Development Commands

| Command | Description |
|---------|-------------|
| `mkdocs serve` | Start development server with hot reload |
| `mkdocs build` | Build static site to `site/` directory |
| `mkdocs gh-deploy` | Deploy directly to GitHub Pages |

## 📝 Adding Content

### Writing Blog Posts

1. Create a new `.md` file in `docs/blog/posts/`
2. Use the naming convention: `YYYY-MM-DD-post-title.md`
3. Add frontmatter for metadata:

```markdown
---
date: 2024-07-12
categories:
  - Technology
  - AI
tags:
  - Python
  - Machine Learning
---

# Your Blog Post Title

Your content here...
```

### Adding Pages

1. Create `.md` files in the `docs/` directory
2. Update navigation in `mkdocs.yml` if needed

## 🚀 Deployment

The site automatically deploys to GitHub Pages via GitHub Actions when you push to the `main` branch.

### Manual Deployment

```bash
mkdocs gh-deploy
```

## 📊 Current Content

### Blog Posts
- 🧠 **Inaugural Post: A Glimpse Inside My Mind** (Feb 2025)
- ⚖️ **Patents for Social Vulnerabilities** (Jul 2024)
- 🏗️ **Pontifex Architecture Implementation Guide** (Jul 2024)
- 🔍 **Pontifex Novel Architecture: Semantic Probing** (Jul 2024)
- 🔬 **Will AI Discover New Conservation Law Before 2050?** (Jul 2024)
- 📖 **Documento Conceitual: A Crônica de Franklin Baldo** (Jul 2024)

### Focus Areas
- **Legal Tech**: AI-powered judicial analysis and automation
- **AI/ML**: NLP, document processing, RAG systems
- **Data Engineering**: Pipeline development, analytics
- **Blockchain**: Web3 identity verification, smart contracts

## 🔗 Links

- **Website**: https://franklinbaldo.github.io
- **GitHub**: https://github.com/franklinbaldo
- **Email**: franklin@franklinbaldo.com

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with 🤍 using [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) by Franklin Baldo
