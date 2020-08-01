module.exports = {
  title: 'Indic Keyboard',
  dest: 'public',
  description: "Indic keyboard brings 23 Indian languages to your mobile along with spell checking, word prediction and transliteration.",
  head: [
    ['link', { rel: "icon", type: "image/png", sizes: "32x32", href: "/logo_32.png"}],
    ['link', { rel: "icon", type: "image/png", sizes: "16x16", href: "/logo_16.png"}],
    ['link', { rel: "icon", type: "image/svg+xml", sizes: "any", href: "/logo.svg"}],
    ['link', { rel: "apple-touch-icon", sizes: "192x192", href: "/logo_192.png"}],
    ['meta', { name: "author", content: "Jishnu Mohan"}],
    ['meta', { name: "theme-color", content: "#4CAF50"}],
  ],
  themeConfig: {
    logo: '/logo.png',
    repo: 'https://gitlab.com/indicproject/indic-keyboard',
    repoLabel: 'Source Code',
    docsRepo: 'https://gitlab.com/indicproject/indic-keyboard-website',
    editLinks: true,
    editLinkText: 'Help us improve this page!',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Download', link: '/#download' },
      { text: 'FAQ', link: '/faq' },
      { text: 'What\'s New', link: '/whats-new' },
      { text: 'Contact Us', link: '/#contact-us' },
    ]
  }
}
