# Admin Dashboard

A modern admin dashboard for managing software activation and licensing, built with React, Vite, and Tailwind CSS.

## Features

- 📊 Dashboard with key metrics and system status
- 👥 User/Device management
- 🔑 Activation code generation and management
- ⚙️ License settings and feature configuration
- 📝 System logs viewer
- 🌓 Dark/Light mode
- 📱 Responsive design

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- React Router
- React Hot Toast

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd admin-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

### Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Project Structure

```
src/
  ├── api/          # API client and endpoints
  ├── components/   # Reusable components
  ├── hooks/        # Custom React hooks
  ├── layouts/      # Layout components
  ├── pages/        # Page components
  ├── store/        # State management
  ├── types/        # TypeScript types
  └── utils/        # Utility functions
```

## API Integration

The dashboard integrates with the following API endpoints:

- `POST /generate-code` - Generate new activation codes
- `POST /activate` - Activate a device
- `GET /license/:device_id` - Get license information
- `GET /health` - Check system health

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
