# One Shot Analytics

Privacy-first, self-hosted analytics for your Next.js applications. Get powerful insights without compromising your users' data.

## Features

- 🔒 **Privacy-First**: Your data stays on your infrastructure. No third-party tracking or data sharing.
- ⚡ **Lightning Fast**: Built for speed with real-time analytics and instant insights.
- 🚀 **Simple Integration**: One line of code to add analytics to any website or app.
- 🏠 **Self-Hosted**: Deploy on your own infrastructure with complete control.

## Quick Start

1. Install the package:
```bash
npm install @one-shot-analytics/react
```

2. Add to your app:
```jsx
import { Analytics } from '@one-shot-analytics/react'

export default function App() {
  return (
    <>
      <Analytics siteId="your-site-id" />
      {/* Your app */}
    </>
  )
}
```

3. Deploy your analytics server:
```bash
npx create-one-shot-analytics
```

## Features

- Real-time visitor tracking
- Page view analytics
- Traffic sources and campaigns
- Custom event tracking
- Geographic data
- Device and browser stats
- Self-hosted infrastructure
- Privacy-focused design
- No cookies required
- GDPR compliant

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [One Shot Analytics]
