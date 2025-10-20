# A Multi-Agent AI System for Automating Startup workflows

A comprehensive AI-powered platform designed to help startups automate their business planning, investor relations, and strategic decision-making using advanced Claude AI integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

The AI Startup Platform is a full-stack application that leverages Anthropic's Claude AI to provide intelligent startup advisory services. The platform combines comprehensive project management capabilities with context-aware AI assistance, enabling founders to receive strategic guidance, prepare for investor meetings, and manage their startup journey from idea to scale.

### Key Capabilities

- **Intelligent Advisory System**: Context-aware AI assistance powered by Claude 3.5 (Sonnet & Haiku)
- **Project Lifecycle Management**: Track projects through 5 stages (Idea, Validation, MVP, Growth, Scale)
- **Investor Relations**: Specialized handling of investor objections with structured responses
- **Collaborative Workspace**: Team collaboration with role-based access control
- **Comprehensive Analytics**: Track metrics, traction, and business model evolution
- **Version Control**: Project versioning with comparison and rollback capabilities

## Features

### Authentication & Security

- Secure user registration and authentication with JWT
- Multi-device session management (up to 5 concurrent sessions)
- Account protection with automatic lockout after failed login attempts
- Password reset flow with time-limited tokens
- Activity logging and security monitoring
- Password history tracking to prevent reuse

### Project Management

- **Five-Stage Lifecycle Tracking**

  - Idea: Concept validation and initial planning
  - Validation: Market research and customer discovery
  - MVP: Minimum viable product development
  - Growth: User acquisition and scaling
  - Scale: Market expansion and optimization

- **Comprehensive Project Data**

  - Market research with TAM/SAM/SOM analysis
  - Competitor tracking and differentiation
  - User personas with demographics and psychographics
  - Business model canvas (revenue streams, pricing strategies)
  - Team member profiles with roles and equity
  - Traction metrics (users, revenue, engagement)
  - Funding information and runway tracking
  - Product roadmap with milestone management
  - Risk assessment with mitigation strategies

- **Collaboration Features**
  - Role-based access (Owner, Editor, Viewer)
  - Real-time collaboration
  - Activity tracking and audit logs
  - Project versioning and history

### AI Chat Interface

- **Context-Aware Conversations**: AI responses informed by project data using RAG (Retrieval-Augmented Generation)
- **Smart Model Selection**: Automatic selection between Claude Sonnet (complex) and Haiku (simple) based on query complexity
- **Specialized Modes**:

  - General startup advisory
  - Investor objection handling with 3-part structured responses
  - Strategic business planning
  - Technical guidance

- **Advanced Features**:
  - Message management (pin, star, rate)
  - Conversation search and filtering
  - Export capabilities (JSON, Text, Markdown)
  - Action item tracking from conversations
  - Auto-summarization of discussions
  - Token usage tracking and statistics

### User Dashboard

- Projects overview with status indicators
- Filtering by stage, status, and favorites
- Recent activity timeline
- Quick access to key features
- Performance metrics and insights

## Technology Stack

### Backend

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **AI Integration**: Anthropic Claude SDK
- **Security**:
  - Helmet (security headers)
  - CORS
  - express-rate-limit
  - express-mongo-sanitize
  - bcryptjs (password hashing)
- **Validation**: express-validator
- **Email**: Nodemailer
- **Logging**: Morgan
- **Testing**: Jest with Supertest
- **Code Quality**: ESLint, Prettier

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**:
  - React Context API
  - Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Notifications**: react-hot-toast
- **Real-time**: Socket.io-client
- **Markdown**: react-markdown with remark-gfm
- **Code Highlighting**: highlight.js
- **Date Handling**: date-fns

## Architecture

### System Design

```
┌─────────────────┐
│   React SPA     │
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS/REST
         │
┌────────▼────────┐
│  Express API    │
│   (Backend)     │
└────┬────┬───┬───┘
     │    │   │
     │    │   └─────────┐
     │    │             │
┌────▼────▼──┐   ┌─────▼──────┐
│  MongoDB   │   │ Claude AI  │
│  Database  │   │    API     │
└────────────┘   └────────────┘
```

### Backend Architecture

- **MVC Pattern**: Clear separation of Models, Controllers, and Services
- **Middleware Stack**: Modular request processing pipeline
- **Error Handling**: Centralized error handling with custom ApiError class
- **Service Layer**: Business logic abstraction for reusability
- **Repository Pattern**: Data access layer abstraction

### Frontend Architecture

- **Component-Based**: Reusable, composable React components
- **Context Providers**: Global state management for auth and projects
- **Custom Hooks**: Encapsulated logic for state and side effects
- **Protected Routes**: Authentication guards for secure pages
- **API Abstraction**: Centralized Axios configuration

## Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- MongoDB (local installation or MongoDB Atlas account)
- Anthropic API key (for Claude AI integration)
- Email service credentials (for password reset functionality)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/RazaAli1010/fyp-agentic-AI.git
   cd ai-startup-platform
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**

   Create `.env` file in the `backend` directory:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database
   MONGODB_URI=mongodb://localhost:27017/startup-ai

   # JWT Configuration
   JWT_SECRET=your-secure-jwt-secret-key-min-32-chars
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d

   # Claude AI
   CLAUDE_API_KEY=your-anthropic-api-key

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@yourstartup.com

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX=5

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

   Create `.env` file in the `frontend` directory:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start the development servers**

   Backend:

   ```bash
   cd backend
   npm run dev
   ```

   Frontend (in a new terminal):

   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Configuration

### Environment Variables

#### Backend Configuration

| Variable                  | Description                | Default       | Required |
| ------------------------- | -------------------------- | ------------- | -------- |
| `NODE_ENV`                | Environment mode           | `development` | Yes      |
| `PORT`                    | Server port                | `5000`        | Yes      |
| `MONGODB_URI`             | MongoDB connection string  | -             | Yes      |
| `JWT_SECRET`              | Secret key for JWT signing | -             | Yes      |
| `JWT_ACCESS_EXPIRY`       | Access token expiration    | `15m`         | No       |
| `JWT_REFRESH_EXPIRY`      | Refresh token expiration   | `7d`          | No       |
| `CLAUDE_API_KEY`          | Anthropic API key          | -             | Yes      |
| `FRONTEND_URL`            | Frontend application URL   | -             | Yes      |
| `EMAIL_HOST`              | SMTP server host           | -             | Yes      |
| `EMAIL_PORT`              | SMTP server port           | `587`         | No       |
| `EMAIL_USER`              | Email account username     | -             | Yes      |
| `EMAIL_PASSWORD`          | Email account password     | -             | Yes      |
| `EMAIL_FROM`              | Sender email address       | -             | Yes      |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window          | `900000`      | No       |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window    | `100`         | No       |
| `CORS_ORIGIN`             | Allowed CORS origin        | -             | Yes      |

#### Frontend Configuration

| Variable       | Description          | Required |
| -------------- | -------------------- | -------- |
| `VITE_API_URL` | Backend API base URL | Yes      |

### Database Setup

The application uses MongoDB. You can use either:

1. **Local MongoDB**

   ```bash
   # Install MongoDB Community Edition
   # Start MongoDB service
   mongod --dbpath /path/to/data
   ```

2. **MongoDB Atlas** (Cloud)
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Get connection string and update `MONGODB_URI`

### Claude AI Setup

1. Sign up at https://www.anthropic.com/
2. Generate an API key from the dashboard
3. Add the key to `CLAUDE_API_KEY` in `.env`

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint                      | Description            | Auth Required |
| ------ | ----------------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`              | Register new user      | No            |
| POST   | `/auth/login`                 | User login             | No            |
| POST   | `/auth/logout`                | User logout            | Yes           |
| POST   | `/auth/refresh`               | Refresh access token   | No            |
| POST   | `/auth/forgot-password`       | Request password reset | No            |
| POST   | `/auth/reset-password/:token` | Reset password         | No            |
| GET    | `/auth/me`                    | Get current user       | Yes           |
| PUT    | `/auth/profile`               | Update profile         | Yes           |
| PUT    | `/auth/password`              | Change password        | Yes           |
| DELETE | `/auth/account`               | Delete account         | Yes           |

### Project Endpoints

| Method | Endpoint                        | Description             | Auth Required |
| ------ | ------------------------------- | ----------------------- | ------------- |
| GET    | `/projects`                     | Get all projects        | Yes           |
| POST   | `/projects`                     | Create new project      | Yes           |
| GET    | `/projects/:id`                 | Get project details     | Yes           |
| PUT    | `/projects/:id`                 | Update project          | Yes           |
| DELETE | `/projects/:id`                 | Delete project          | Yes           |
| GET    | `/projects/:id/versions`        | Get version history     | Yes           |
| POST   | `/projects/:id/versions`        | Create version snapshot | Yes           |
| GET    | `/projects/statistics/overview` | Get statistics          | Yes           |
| POST   | `/projects/:id/collaborators`   | Add collaborator        | Yes           |
| PUT    | `/projects/:id/team-members`    | Update team members     | Yes           |
| PUT    | `/projects/:id/market-research` | Update market research  | Yes           |
| PUT    | `/projects/:id/business-model`  | Update business model   | Yes           |
| PUT    | `/projects/:id/traction`        | Update traction metrics | Yes           |
| PUT    | `/projects/:id/roadmap`         | Update roadmap          | Yes           |

### Chat Endpoints

| Method | Endpoint                         | Description               | Auth Required |
| ------ | -------------------------------- | ------------------------- | ------------- |
| POST   | `/chat/message`                  | Send message to AI        | Yes           |
| POST   | `/chat/investor-objection`       | Handle investor objection | Yes           |
| GET    | `/chat/conversations`            | Get all conversations     | Yes           |
| GET    | `/chat/conversations/:id`        | Get conversation details  | Yes           |
| DELETE | `/chat/conversations/:id`        | Delete conversation       | Yes           |
| PUT    | `/chat/messages/:id/pin`         | Pin/unpin message         | Yes           |
| PUT    | `/chat/messages/:id/star`        | Star/unstar message       | Yes           |
| PUT    | `/chat/messages/:id/rate`        | Rate message              | Yes           |
| GET    | `/chat/search`                   | Search messages           | Yes           |
| GET    | `/chat/statistics`               | Get chat statistics       | Yes           |
| POST   | `/chat/conversations/:id/export` | Export conversation       | Yes           |

### Rate Limits

- **Global**: 100 requests per 15 minutes
- **Authentication endpoints**: 5-10 requests per 15 minutes
- **Password reset**: 3 requests per 15 minutes
- **Chat endpoints**: 50 requests per minute

## Project Structure

```
ai-startup-platform/
├── backend/
│   ├── config/
│   │   ├── db.js                 # Database connection
│   │   ├── env.js                # Environment configuration
│   │   └── claude.js             # Claude AI setup
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── chatController.js     # Chat functionality
│   │   └── projectController.js  # Project management
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── validator.js          # Request validation
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Project.js            # Project schema
│   │   ├── ChatHistory.js        # Chat schema
│   │   └── ProjectVersion.js     # Version schema
│   ├── routes/
│   │   ├── auth.js               # Auth routes
│   │   ├── chat.js               # Chat routes
│   │   └── projects.js           # Project routes
│   ├── services/
│   │   ├── authService.js        # Auth business logic
│   │   ├── claudeService.js      # AI integration
│   │   ├── emailService.js       # Email functionality
│   │   ├── projectService.js     # Project logic
│   │   └── ragService.js         # RAG context building
│   ├── utils/
│   │   ├── constants.js          # App constants
│   │   ├── ApiError.js           # Custom error class
│   │   └── helpers.js            # Helper functions
│   ├── .env                      # Environment variables
│   ├── server.js                 # Application entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/             # Auth components
    │   │   ├── chat/             # Chat interface
    │   │   ├── projects/         # Project components
    │   │   ├── shared/           # Reusable components
    │   │   └── layout/           # Layout components
    │   ├── contexts/
    │   │   ├── AuthContext.jsx   # Auth state
    │   │   └── ProjectContext.jsx # Project state
    │   ├── hooks/
    │   │   ├── useAuth.js        # Auth hook
    │   │   ├── useChat.js        # Chat hook
    │   │   └── useProject.js     # Project hook
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # Main dashboard
    │   │   ├── ProjectDetails.jsx # Project view
    │   │   ├── ChatInterface.jsx  # Chat page
    │   │   └── Auth/             # Auth pages
    │   ├── services/
    │   │   └── api.js            # API client
    │   ├── utils/
    │   │   ├── constants.js      # Frontend constants
    │   │   └── helpers.js        # Utility functions
    │   ├── App.jsx               # Root component
    │   ├── main.jsx              # Application entry
    │   └── index.css             # Global styles
    ├── .env                      # Environment variables
    ├── vite.config.js            # Vite configuration
    ├── tailwind.config.js        # Tailwind setup
    └── package.json
```

## Security

### Implemented Security Measures

1. **Authentication & Authorization**

   - JWT-based authentication with access and refresh tokens
   - Secure password hashing with bcrypt (12 salt rounds)
   - Password history tracking (prevents reuse of last 5 passwords)
   - Multi-device session management with token rotation

2. **Account Protection**

   - Rate limiting on all endpoints
   - Account lockout after 5 failed login attempts
   - 2-hour automatic unlock period
   - Activity logging for security monitoring

3. **Input Validation & Sanitization**

   - express-validator for request validation
   - express-mongo-sanitize to prevent NoSQL injection
   - Helmet for security headers (CSP, XSS protection, etc.)
   - CORS configuration with origin whitelisting

4. **Data Protection**

   - Encrypted database connections
   - Environment-based secrets management
   - Secure token storage and transmission
   - Password reset tokens with 30-minute expiry

5. **Error Handling**
   - Sanitized error messages (no sensitive data leakage)
   - Custom error classes with appropriate HTTP status codes
   - Graceful degradation and error recovery

### Security Best Practices

- Use HTTPS in production
- Keep dependencies updated regularly
- Rotate JWT secrets periodically
- Monitor authentication logs for suspicious activity
- Enable database authentication and encryption
- Use strong, unique passwords for all services
- Implement backup and disaster recovery plans

## Development

### Backend Development

```bash
cd backend

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Seed database with sample data
npm run seed
```

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Quality

The project uses ESLint and Prettier to maintain code quality and consistency:

- **ESLint**: Identifies problematic patterns in JavaScript code
- **Prettier**: Enforces consistent code formatting
- **Pre-configured rules**: Industry-standard configurations

### Testing

Backend testing is implemented with Jest:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- authService.test.js
```

## Deployment

### Backend Deployment

1. **Build and prepare**

   ```bash
   cd backend
   npm install --production
   ```

2. **Set environment variables** on your hosting platform

3. **Deploy to hosting service** (examples):

   - **Heroku**: `git push heroku main`
   - **AWS EC2**: Use PM2 for process management
   - **DigitalOcean**: Deploy via App Platform or Droplet
   - **Railway**: Connect GitHub repository

4. **Database setup**
   - Use MongoDB Atlas for production database
   - Configure connection string in environment variables
   - Set up database backups

### Frontend Deployment

1. **Build the application**

   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `dist` folder** to:

   - **Vercel**: `vercel --prod`
   - **Netlify**: Drag and drop `dist` folder or use CLI
   - **AWS S3 + CloudFront**: Upload to S3 bucket
   - **Firebase Hosting**: `firebase deploy`

3. **Configure environment variables** on hosting platform

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, randomly generated `JWT_SECRET`
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for production frontend URL
- [ ] Set up MongoDB Atlas with authentication
- [ ] Configure email service (SendGrid, AWS SES, etc.)
- [ ] Set appropriate rate limits
- [ ] Enable database backups
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure monitoring and logging
- [ ] Test password reset email flow
- [ ] Verify Claude API key and usage limits
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and DNS settings

## Contributing

We welcome contributions to the AI Startup Platform. Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/your-feature`)
3. **Commit your changes** (`git commit -m 'Add some feature'`)
4. **Push to the branch** (`git push origin feature/your-feature`)
5. **Open a Pull Request**

### Coding Standards

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Raza Ali** - Team Leader - [GitHub](https://github.com/RazaAli1010)
- **Sami Ur Rehman** 
- **Shahbaz Hassan** 

## Acknowledgments

- Anthropic for Claude AI API
- MongoDB for database infrastructure
- React and Vite communities for excellent tooling
- All contributors and testers

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

**Version**: 1.0.0
**Last Updated**: 2025
**Status**: Active Development

