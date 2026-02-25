# Guatapets

> A web application about animals in Guatapé, Colombia – a place where you can post lost animals, found animals, and adoptable animals.

## 🐾 Overview

Guatapets is a community-driven platform to help pets in Guatapé. It connects people who have found lost animals with those searching for their pets, and it also serves as a hub to find adoptable animals looking for a loving home.

## 🛠️ Infrastructure & Tech Stack

This project is built using modern web technologies to ensure optimal performance and developer experience:

- **[Astro](https://astro.build/)**: For both Frontend and Server implementation.
- **[Bun](https://bun.sh/)**: As the fast JavaScript runtime.
- **[Vercel](https://vercel.com/)**: For fast and reliable deployment.
- **[Turso](https://turso.tech/)**: An edge-hosted SQLite database.
- **[Drizzle ORM](https://orm.drizzle.team/)**: For type-safe database interactions.

## 🚀 Getting Started

### Prerequisites

Make sure you have [Bun](https://bun.sh/docs/installation) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone <repository-url>
   cd guatapets
   ```

2. Install the dependencies using Bun:

   ```bash
   bun install
   ```

### Development

To start the local development server:

```bash
bun run dev
```

The application will be running at `http://localhost:4321` (by default).

### Build & Preview

To build the project for production:

```bash
bun run build
```

To preview the built project locally:

```bash
bun run preview
```

## 📁 Project Structure

```text
guatapets/
├── public/           # Static assets (images, fonts, raw files)
├── src/
│   ├── assets/       # Processed assets (styles, etc.)
│   ├── components/   # Reusable UI components
│   ├── layouts/      # Shared page layouts
│   └── pages/        # File-based routing (pages and API endpoints)
├── astro.config.mjs  # Astro configuration
├── package.json      # Project configuration and script commands
└── tsconfig.json     # TypeScript config
```

## 📝 Coding Style & Guidelines

To maintain code quality and a clean architecture, please follow these guidelines when contributing:

- **TypeScript First**: Use TypeScript for all logic and components.
- **Testing**: Write simple tests to validate functionality.
- **Best Practices**: Follow the core best practices for [Astro](https://docs.astro.build/) and [Bun](https://bun.sh/docs).
- **Markup**: Always use semantic HTML to ensure accessibility.

## 🧑‍💻 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or open a PR.
