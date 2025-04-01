# ATAR Calculator

A client-side web application for calculating ATAR scores, designed for educational institutions.

## Features

- Client-side ATAR and TE score calculations
- Offline-capable after initial authentication
- Privacy-focused (no student data transmitted)
- Real-time score validation
- Subject scaling support

## Development

### Prerequisites

- Node.js (version X.X.X)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd atar-calculator
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start development server
```bash
npm run dev
# or
yarn dev
```

### Project Structure

```
src/
├── components/     # React components
├── utils/         # Utility functions and calculations
├── interfaces/    # TypeScript interfaces
├── constants/     # Constant values
└── data/         # Static data files
```

## Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `release/*` - Release preparation

## License

[License Type] - See LICENSE file for details 