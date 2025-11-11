# CardShop

A modern e-commerce platform for trading card shops built with SvelteKit 2, Svelte 5, and
PostgreSQL.

## Features

- **User Shopping Experience**
  - Browse cards by category
  - Real-time stock tracking
  - Shopping cart with anonymous support (localStorage)
  - Automatic cart migration on sign-in
  - Order history and tracking

- **Admin Dashboard**
  - Inventory management with low stock alerts
  - Category management
  - Order processing
  - Real-time statistics

- **Authentication**
  - Google OAuth integration via better-auth
  - Role-based access control (user/admin)
  - Secure session management

## Tech Stack

- **Framework:** SvelteKit 2 with Svelte 5 (runes)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** better-auth with Google OAuth
- **Styling:** Tailwind CSS v4
- **UI Components:** bits-ui, shadcn-svelte
- **Package Manager:** Bun

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3.2
- PostgreSQL database
- Google OAuth credentials (for authentication)

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd cardshop
bun install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgres://user:password@host:port/db-name"

# Authentication
BETTER_AUTH_SECRET="<generate-a-random-secret>"
BETTER_AUTH_URL="http://localhost:5173"

# Google OAuth
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"

# Site URL
PULIC_SITE_URL="http://localhost:5173"
```

**Generating a secure secret:**

```bash
openssl rand -base64 32
```

**Setting up Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5173/api/auth/callback/google`

### 3. Database Setup

```bash
# Push schema to database
bun run db:push

# Or generate migrations
bun run db:generate
bun run db:migrate
```

### 4. Create Admin User

After signing in with Google for the first time, you need to manually set your role to admin:

```sql
-- Connect to your PostgreSQL database
psql $DATABASE_URL

-- Set your user as admin (replace with your email)
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@gmail.com';
```

Verify admin access:

```sql
SELECT id, name, email, role FROM "user";
```

### 5. Seed Database (Optional)

If you want sample data, you can run the seed script:

```bash
bun run src/lib/server/db/seed.ts
```

This creates:

- Sample categories (Pokémon, Magic: The Gathering, Yu-Gi-Oh!, etc.)
- Sample card items with stock quantities
- Low stock alerts for testing

### 6. Start Development Server

```bash
bun run dev
```

Visit `http://localhost:5173` to see your app.

## Available Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `bun run dev`         | Start development server           |
| `bun run build`       | Build for production               |
| `bun run preview`     | Preview production build           |
| `bun run check`       | Run TypeScript and Svelte checks   |
| `bun run lint`        | Lint code with ESLint and Prettier |
| `bun run format`      | Auto-format code with Prettier     |
| `bun run db:push`     | Push schema changes to database    |
| `bun run db:generate` | Generate migration files           |
| `bun run db:migrate`  | Run migrations                     |
| `bun run db:studio`   | Open Drizzle Studio (database GUI) |

## Project Structure

```
src/
├── lib/
│   ├── components/ui/     # Reusable UI components
│   ├── server/
│   │   └── db/
│   │       ├── schema/    # Database schemas
│   │       ├── migrations/ # Database migrations
│   │       └── index.ts   # Database client
│   ├── auth.ts            # Auth configuration
│   └── utils.ts           # Utility functions
├── routes/
│   ├── admin/             # Admin dashboard pages
│   │   ├── categories/    # Category management
│   │   ├── inventory/     # Stock management
│   │   ├── items/         # Item management
│   │   └── orders/        # Order management
│   ├── api/               # API endpoints
│   │   ├── cart/          # Cart operations
│   │   ├── categories/    # Category CRUD
│   │   ├── items/         # Item CRUD
│   │   └── orders/        # Order processing
│   ├── auth/              # Auth pages
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout page
│   ├── orders/            # Order history
│   └── +page.svelte       # Shop homepage
└── hooks.server.ts        # Server-side hooks
```

## User Roles

### Admin

- Access to `/admin/*` routes
- Manage inventory, categories, items, and orders
- View statistics and low stock alerts

### User (Default)

- Browse and purchase items
- View order history
- Manage shopping cart

## Features in Detail

### Anonymous Cart Support

- Cart stored in localStorage for anonymous users
- Automatically migrates to database on sign-in
- Handles duplicate items and stock validation

### Real-time Stock Management

- Stock decreases on order completion
- Low stock alerts for admins (< 10 units)
- Out of stock prevention at checkout

### Order Management

- Order statuses: pending, processing, completed, cancelled
- Admin can update order status
- Users can view order history

## Database Schema

Key tables:

- `user` - User accounts with role-based access
- `session` - Authentication sessions
- `category` - Product categories
- `item` - Trading card items
- `cart` - User shopping carts
- `cartItem` - Cart line items
- `order` - Customer orders
- `orderItem` - Order line items
- `lowStockAlert` - Admin alerts

## Code Style

- **Formatting:** Prettier (no semis, double quotes, 100 char width)
- **Import Order:** Auto-sorted (third-party → `@/` → relatives → local)
- **TypeScript:** Strict mode, explicit types for exports
- **Svelte:** Runes-based (`$state`, `$props`, `$derived`)
- **Styling:** Tailwind CSS with `cn()` utility for conditional classes

## Production Deployment

### Build

```bash
bun run build
```

### Environment Variables

Update `BETTER_AUTH_URL` and `PULIC_SITE_URL` to your production domain.

### Database

Run migrations in production:

```bash
bun run db:migrate
```

### Hosting

The app uses `@sveltejs/adapter-node` and can be deployed to any Node.js hosting platform:

- Vercel
- Netlify
- Railway
- Fly.io
- DigitalOcean App Platform

## Troubleshooting

### "Invalid session" or auth issues

- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches your domain
- Clear browser cookies and try again

### Database connection errors

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists

### Google OAuth not working

- Verify redirect URI in Google Console matches your app
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure Google+ API is enabled

### Admin pages show 403 Forbidden

- Check user role in database: `SELECT role FROM "user" WHERE email = 'your-email@gmail.com'`
- Update to admin: `UPDATE "user" SET role = 'admin' WHERE email = 'your-email@gmail.com'`

## Contributing

1. Follow the existing code style
2. Run `bun run lint` before committing
3. Test changes thoroughly
4. Update documentation as needed

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
