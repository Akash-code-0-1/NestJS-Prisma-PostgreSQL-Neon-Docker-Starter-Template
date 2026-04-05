# Domenico Backend

A production-ready NestJS backend application for managing salon services, appointments, staff management, and customer relationships. Built with scalability, security, and maintainability in mind.

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm/yarn
- **PostgreSQL** 14+ (or use Docker)
- **Redis** (for caching and session management)
- **Docker & Docker Compose** (optional, for containerized setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd domenico-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure your `.env` file with:
   - `DATABASE_URL` - PostgreSQL connection string
   - `PORT` - Application port (default: 3000)
   - `JWT_SECRET` - Secret key for JWT tokens
   - `REDIS_URL` - Redis connection string
   - Other service-specific variables

4. **Set up the database**
   ```bash
   # Run migrations
   npx prisma migrate deploy
   
   # Generate Prisma client
   npx prisma generate
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

The server will be available at `http://localhost:3000`

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with auto-reload |
| `npm run start:debug` | Start with debugger on port 9229 |
| `npm run start:prod` | Start production build |
| `npm run build` | Build the application |
| `npm run lint` | Run ESLint and fix issues |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests |
| `-+-+-+-+-+-+-+-+-+-+-+` | `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |

## 🏗️ Project Structure

The project follows a modular architecture with NestJS, separating concerns into core modules, feature modules, and utilities.

```
domenico-backend/
├── src/
│   ├── app.module.ts                 # Root application module
│   ├── main.ts                       # Application entry point
│   ├── bootstrap/                    # Application bootstrap utilities
│   │   ├── bootstrap.module.ts
│   │   └── bootstrap.service.ts
│   ├── config/                       # Configuration modules
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── env.config.ts
│   │   ├── redis.config.ts
│   │   └── swagger.config.ts
│   ├── core/                         # Shared core modules and utilities
│   │   ├── cache/                    # Redis caching
│   │   │   ├── cache.module.ts
│   │   │   ├── cache.service.ts
│   │   │   └── cache.decorator.ts
│   │   ├── constants/                # Application constants
│   │   │   ├── app.constants.ts
│   │   │   ├── messages.constants.ts
│   │   │   └── regex.constants.ts
│   │   ├── decorators/               # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── request-id.decorator.ts
│   │   ├── filters/                  # Exception filters
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── prisma-exception.filter.ts
│   │   │   └── global-exception.filter.ts
│   │   ├── guards/                   # Authentication and authorization guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt-refresh.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── throttle.guard.ts
│   │   │   └── optional-jwt.guard.ts
│   │   ├── interceptors/             # Request/response interceptors
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── response.interceptor.ts
│   │   │   ├── request-id.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── logger/                   # Logging with Winston
│   │   │   ├── logger.module.ts
│   │   │   ├── logger.service.ts
│   │   │   └── winston.config.ts
│   │   ├── metrics/                  # Performance metrics with Prometheus
│   │   │   ├── metrics.module.ts
│   │   │   ├── metrics.service.ts
│   │   │   └── prometheus.config.ts
│   │   ├── middleware/               # Custom middleware
│   │   │   ├── request-id.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   └── helmet.middleware.ts
│   │   ├── prisma/                   # Database ORM with Prisma
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.extension.ts
│   │   ├── redis/                    # Redis integration
│   │   │   ├── redis.module.ts
│   │   │   ├── redis.service.ts
│   │   │   └── redis.provider.ts
│   │   └── utils/                    # Utility functions
│   │       ├── crypto.util.ts
│   │       ├── date.util.ts
│   │       ├── pagination.util.ts
│   │       ├── response.util.ts
│   │       └── validators.util.ts
│   ├── health/                       # Health checks
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.service.ts
│   ├── jobs/                         # Background jobs
│   │   ├── jobs.module.ts
│   │   ├── appointment-reminder.job.ts
│   │   ├── cleanup.job.ts
│   │   └── email-notification.job.ts
│   └── modules/                      # Feature-specific modules
│       ├── analytics/                # Analytics and reporting
│       │   ├── analytics.module.ts
│       │   ├── analytics.controller.ts
│       │   ├── analytics.service.ts
│       │   ├── dto/
│       │   │   └── analytics-query.dto.ts
│       │   └── entities/
│       │       └── analytics.entity.ts
│       ├── automations/              # Automated workflows
│       │   ├── automations.module.ts
│       │   ├── automations.controller.ts
│       │   ├── automations.service.ts
│       │   ├── dto/
│       │   │   ├── create-automation.dto.ts
│       │   │   └── update-automation.dto.ts
│       │   └── entities/
│       │       └── automation.entity.ts
│       ├── crm/                      # Customer Relationship Management
│       │   ├── crm.module.ts
│       │   ├── crm.controller.ts
│       │   ├── crm.service.ts
│       │   ├── dto/
│       │   │   └── crm-query.dto.ts
│       │   └── entities/
│       │       └── crm.entity.ts
│       ├── finance/                  # Financial management
│       │   ├── finance.module.ts
│       │   ├── finance.controller.ts
│       │   ├── finance.service.ts
│       │   ├── receipts/             # Receipt handling
│       │   │   ├── receipts.controller.ts
│       │   │   ├── receipts.service.ts
│       │   │   ├── dto/
│       │   │   │   ├── create-receipt.dto.ts
│       │   │   │   └── update-receipt.dto.ts
│       │   │   └── entities/
│       │   │       └── receipt.entity.ts
│       │   └── transactions/         # Transaction management
│       │       ├── transactions.controller.ts
│       │       ├── transactions.service.ts
│       │       └── entities/
│       │           └── transaction.entity.ts
│       ├── iam/                      # Identity and Access Management
│       │   ├── iam.module.ts
│       │   ├── auth/                 # Authentication
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── dto/
│       │   │   │   ├── login.dto.ts
│       │   │   │   ├── register.dto.ts
│       │   │   │   ├── refresh-token.dto.ts
│       │   │   │   └── change-password.dto.ts
│       │   │   ├── strategies/       # Passport strategies
│       │   │   │   ├── jwt.strategy.ts
│       │   │   │   ├── jwt-refresh.strategy.ts
│       │   │   │   └── local.strategy.ts
│       │   │   └── entities/
│       │   │       └── auth.entity.ts
│       ├── settings/                # Application settings
│       │   ├── settings.module.ts
│       │   ├── settings.controller.ts
│       │   ├── settings.service.ts
│       │   ├── dto/
│       │   │   └── update-settings.dto.ts
│       │   └── entities/
│       │       └── setting.entity.ts
│       ├── support/                 # Support and feedback
│       │   ├── support.module.ts
│       │   ├── support.controller.ts
│       │   ├── support.service.ts
│       │   ├── dto/
│       │   │   ├── create-contact.dto.ts
│       │   │   └── create-feedback.dto.ts
│       │   └── entities/
│       │       ├── contact.entity.ts
│       │       └── feedback.entity.ts
│       └── tenancy/                 # Multi-tenant salon management
│           ├── tenancy.module.ts
│           ├── appointments/         # Appointment scheduling
│           │   ├── appointments.controller.ts
│           │   ├── appointments.service.ts
│           │   ├── dto/
│           │   │   ├── create-appointment.dto.ts
│           │   │   └── update-appointment.dto.ts
│           │   └── entities/
│           │       └── appointment.entity.ts
│           ├── buy-voucher/          # Voucher purchasing
│           │   ├── buy-voucher.controller.ts
│           │   ├── buy-voucher.service.ts
│           │   ├── dto/
│           │   │   └── buy-voucher.dto.ts
│           │   └── entities/
│           │       └── voucher-purchase.entity.ts
│           ├── contact/              # Contact management
│           │   ├── contact.controller.ts
│           │   ├── contact.service.ts
│           │   ├── dto/
│           │   │   ├── create-contact.dto.ts
│           │   │   └── update-contact.dto.ts
│           │   └── entities/
│           │       └── contact.entity.ts
│           ├── create-voucher/       # Voucher creation
│           │   ├── create-voucher.controller.ts
│           │   ├── create-voucher.service.ts
│           │   ├── dto/
│           │   │   ├── create-voucher.dto.ts
│           │   │   └── update-voucher.dto.ts
│           │   └── entities/
│           │       └── voucher.entity.ts
│           ├── invitations/          # Invitation system
│           │   ├── invitations.controller.ts
│           │   ├── invitations.service.ts
│           │   ├── dto/
│           │   │   ├── create-invitation.dto.ts
│           │   │   └── accept-invitation.dto.ts
│           │   └── entities/
│           │       └── invitation.entity.ts
│           ├── salon-users/          # Salon staff management
│           │   ├── salon-users.controller.ts
│           │   ├── salon-users.service.ts
│           │   ├── dto/
│           │   │   ├── create-salon-user.dto.ts
│           │   │   └── update-salon-user.dto.ts
│           │   └── entities/
│           │       └── salon-user.entity.ts
│           └── salons/               # Salon business management
│               ├── salons.controller.ts
│               ├── salons.service.ts
│               ├── dto/
│               │   ├── create-salon.dto.ts
│               │   └── update-salon.dto.ts
│               └── entities/
│                   └── salon.entity.ts
├── test/                            # Testing suite
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── appointments.e2e-spec.ts
│   ├── jest-e2e.json
│   └── fixtures/
│       ├── users.fixture.ts
│       ├── salons.fixture.ts
│       └── appointments.fixture.ts
├── prisma/                          # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
│       └── [migration_folders]/
├── docker/                          # Docker configurations
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── .dockerignore
├── .env.example                     # Environment variables template
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── docker-compose.yml               # Development Docker Compose
├── docker-compose.prod.yml          # Production Docker Compose
├── jest.config.js                   # Jest configuration
├── package.json                     # NPM dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── README.md                        # This file
└── .gitignore                       # Git ignore rules
```

## 🔐 Key Features

### Authentication & Authorization
- **JWT-based authentication** for multiple user roles
- **Role-Based Access Control (RBAC)** with custom decorators
- **OAuth support** via Passport.js
- **Refresh token mechanism** for secure session management
- Multiple authentication strategies:
  - Admin authentication
  - Salon owner authentication
  - Employee authentication
  - Client authentication

### Tenancy & Multi-Tenant Support
- **Salon management** with isolated data
- **Salon user management** for staff
- **Appointment scheduling** with participant tracking
- **Voucher system** for promotional campaigns
- **Contact management** for customer relationships

### Business Features
- **Service management** with pricing and descriptions
- **Employee management** with roles and permissions
- **Appointment booking** with availability tracking
- **Testimonials & reviews** from clients
- **Financial receipts** and transaction tracking
- **Audit logging** for compliance

### Infrastructure
- **Redis caching** for performance optimization
- **Request logging** with Winston
- **Performance metrics** and monitoring
- **Global exception handling** with custom filters
- **Request validation** with class-validator
- **Rate limiting** with Throttler
- **Health checks** for application monitoring
- **Request ID tracking** for distributed logging

## 🗄️ Database Schema

The application uses **PostgreSQL** with **Prisma ORM**. Key entities include:

- **Users** - Global user identity with role-based relationships
- **Admin** - Administrative users
- **SalonUser** - Staff members within salons
- **Salon** - Salon businesses
- **Appointments** - Booking system
- **Testimonials** - Client reviews
- **Vouchers** - Promotional voucher system
- **Receipts** - Financial transactions
- **Services** - Salon services with pricing
- **ContactMessages** - Customer inquiries

### Running Migrations

```bash
# Create a new migration
npx prisma migrate dev --name <migration_name>

# View data in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## 🐳 Docker Setup

### Development Environment
```bash
docker-compose up --build
```

### Production Environment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

The application will be available at the configured port (default: 3000).

## 🔒 Security Features

- **Password hashing** with bcryptjs
- **JWT token validation** with automatic refresh
- **Role-based request guards**
- **Rate limiting** on endpoints
- **Input validation** with class-validator
- **Global exception filtering** preventing information leakage
- **CORS** configuration (configurable)
- **Request ID tracking** for audit trails

## 📊 Logging & Monitoring

The application uses **Winston** for comprehensive logging:

- `info` - General application events
- `error` - Error tracking
- `debug` - Development debugging
- `warn` - Warning messages

Access logs are available in:
- Console output
- Application log files (if configured)

## 🧪 Testing

### Unit Tests
```bash
npm test
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

### End-to-End Tests
```bash
npm run test:e2e
```

Tests are configured with **Jest** and located in the `test/` directory.

## 🛠️ Development

### Code Quality

```bash
# Run linter with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

### Project Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **NestJS conventions** for architecture
- **Prisma schema** for database-first design

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/domenico

# JWT
JWT_SECRET=your-secret-key-here

# Redis
REDIS_URL=redis://localhost:6379

# Optional configurations
LOG_LEVEL=debug
ENABLE_DEBUG_INTERCEPTOR=true
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

Follow the existing code style and include tests for new features.

## 📞 Support

For issues or questions, please create an issue in the repository or contact the development team.

## 📄 License

UNLICENSED - All rights reserved

---

**Last Updated:** April 2026  
**Version:** 0.0.1
