# HarnessFlow - Development Setup Guide

**Version:** 1.0
**Last Updated:** 2025-11-19

This guide will help you set up the HarnessFlow development environment on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL** >= 15 ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/thebibbi/harnessflow.git
cd harnessflow
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspaces (backend, frontend, shared).

### 3. Set Up Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker compose up -d postgres

# The database will be available at localhost:5432
# Database: harnessflow_dev
# User: postgres
# Password: postgres
```

#### Option B: Using Local PostgreSQL

If PostgreSQL is installed locally:

```bash
# Create database
createdb harnessflow_dev

# Or using psql
psql -U postgres -c "CREATE DATABASE harnessflow_dev;"
```

### 4. Configure Environment Variables

```bash
# Backend environment
cd packages/backend
cp .env.example .env
# Edit .env if needed (default values work for local development)
```

The default `.env` configuration:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/harnessflow_dev?schema=public"
```

### 5. Run Database Migrations

```bash
# From the backend directory
cd packages/backend
npx prisma generate
npx prisma migrate dev --name init
```

This will:

- Generate Prisma Client
- Create all database tables based on the schema
- Set up the initial database structure

### 6. Start Development Servers

```bash
# From project root, start both servers
cd ../..
pnpm dev

# OR start individually:
pnpm dev:backend    # Backend API (http://localhost:4000)
pnpm dev:frontend   # Frontend UI (http://localhost:3000)
```

### 7. Verify Installation

**Backend Health Check:**

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-19T09:00:00.000Z",
  "service": "harnessflow-backend",
  "version": "0.1.0",
  "database": "ok"
}
```

**Frontend:**
Open http://localhost:3000 in your browser. You should see the HarnessFlow welcome page.

---

## Project Structure

```
harnessflow/
├── packages/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   ├── prisma/       # Database schema & migrations
│   │   ├── .env          # Environment variables
│   │   └── package.json
│   ├── frontend/         # Next.js web application
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── package.json
│   └── shared/           # Shared TypeScript types
│       ├── src/types/
│       └── package.json
├── docs/                 # Project documentation
├── docker-compose.yml    # Docker services (PostgreSQL)
├── package.json          # Root package.json (workspace config)
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

---

## Available Scripts

### Root Level

```bash
pnpm dev              # Start both backend and frontend
pnpm dev:backend      # Start backend only
pnpm dev:frontend     # Start frontend only
pnpm build            # Build all packages
pnpm test             # Run tests in all packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Prettier
pnpm type-check       # Run TypeScript type checking
pnpm clean            # Clean all build artifacts
```

### Backend-Specific

```bash
cd packages/backend

pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio (DB GUI)
```

### Frontend-Specific

```bash
cd packages/frontend

pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Lint code
pnpm test             # Run tests
```

---

## Database Management

### Prisma Studio (Database GUI)

```bash
cd packages/backend
pnpm prisma:studio
```

Opens at http://localhost:5555 - visual database editor.

### Create a New Migration

```bash
cd packages/backend

# 1. Modify prisma/schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name your_migration_name
```

### Reset Database

```bash
cd packages/backend
npx prisma migrate reset
```

⚠️ **Warning:** This will delete all data!

---

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run Tests with Coverage

```bash
pnpm test:coverage
```

---

## Code Quality

### Linting

```bash
# Check for issues
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

### Formatting

```bash
# Check formatting
pnpm format:check

# Format all files
pnpm format
```

### Type Checking

```bash
pnpm type-check
```

---

## Git Workflow

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**

```bash
git commit -m "feat(backend): add health check endpoint"
git commit -m "fix(frontend): correct button styling on mobile"
git commit -m "docs: update setup instructions"
```

### Pre-commit Hooks

Husky is configured to run:

- Linting on staged files
- Commit message validation

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**

```bash
# Find and kill process using port 4000
lsof -ti:4000 | xargs kill -9

# Or use a different port in .env
PORT=4001
```

### Database Connection Fails

**Error:** `P1000: Authentication failed`

**Solution:**

1. Check PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
2. Verify DATABASE_URL in `.env`
3. Ensure database exists: `psql -U postgres -c "\l" | grep harnessflow`

### Prisma Client Not Found

**Error:** `@prisma/client did not initialize yet`

**Solution:**

```bash
cd packages/backend
npx prisma generate
```

### Node Modules Issues

**Solution:**

```bash
# Clean install
rm -rf node_modules packages/*/node_modules
pnpm install
```

---

## Docker Setup (Optional)

### Using Docker for Development

```bash
# Start all services (PostgreSQL + optional pgAdmin)
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f postgres

# Access pgAdmin (optional)
docker compose --profile tools up -d pgadmin
# Open http://localhost:5050
# Email: admin@harnessflow.local
# Password: admin
```

---

## Environment Variables Reference

### Backend (.env)

| Variable            | Default                 | Description                  |
| ------------------- | ----------------------- | ---------------------------- |
| `NODE_ENV`          | `development`           | Environment mode             |
| `PORT`              | `4000`                  | Backend server port          |
| `FRONTEND_URL`      | `http://localhost:3000` | CORS allowed origin          |
| `DATABASE_URL`      | `postgresql://...`      | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | -                       | API key for LLM (Phase 2)    |
| `JWT_SECRET`        | -                       | JWT signing secret (Phase 2) |

---

## Next Steps

After setup, you can:

1. **Explore the codebase**
   - Read [Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md)
   - Review [Implementation Roadmap](./docs/implementation/IMPLEMENTATION_ROADMAP.md)

2. **Start developing**
   - See [Contributing Guide](./CONTRIBUTING.md) (coming soon)
   - Check [Architecture Decisions](./docs/consolidated/ARCHITECTURE_DECISION_RECORDS.md)

3. **Join development**
   - Review [todo.md](./todo.md) for current tasks
   - Pick an issue from GitHub
   - Submit your first PR!

---

## Need Help?

- **Documentation:** [docs/README.md](./docs/README.md)
- **Issues:** [GitHub Issues](https://github.com/thebibbi/harnessflow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/thebibbi/harnessflow/discussions)

---

## Phase 1 Status

**Current Phase:** MVP Development (Weeks 1-2)

✅ **Completed:**

- Project structure and monorepo setup
- Development tools configuration (ESLint, Prettier, Husky)
- CI/CD pipeline (GitHub Actions)
- Database schema (Prisma)
- Backend API skeleton (NestJS)
- Frontend skeleton (Next.js 14)
- PostgreSQL setup (Docker + local)
- Health check endpoint with database connectivity

🔨 **In Progress:**

- Week 3-4: Repository pattern and unit tests
- Weeks 5-8: Import/export parsers (WireViz, Excel)

---

**Happy Coding! 🚀**
