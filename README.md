# Self-Evolving Workflow Automator

A dashboard application that can dynamically evolve its own UI features and automate workflows based on natural-language requests. The system integrates a universal workflow automator with a self-evolving spec-to-code pipeline powered by Kiro, enabling users to request new features and workflows through natural language, which are then automatically implemented and deployed.

## Features

- **Dynamic UI Evolution**: Request new UI features in natural language and see them automatically generated and integrated
- **Workflow Automation**: Create complex workflows using natural language descriptions
- **Real-time Monitoring**: Live system metrics, alerts, and workflow execution status
- **Self-Healing**: Automatic error recovery and system health monitoring
- **WebSocket Integration**: Real-time updates across all connected clients
- **Comprehensive Logging**: Structured logging with configurable levels and outputs
- **Alert System**: Intelligent alerting with customizable rules and notifications

## Architecture

The application consists of:

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with migration support
- **Real-time**: WebSocket connections for live updates
- **Monitoring**: Built-in system monitoring and alerting
- **Containerization**: Docker support for easy deployment

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- (Optional) Docker and Docker Compose for containerized deployment

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd self-evolving-workflow-automator
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Start the development environment**
   ```bash
   npm run start
   ```
   
   Or on Windows:
   ```cmd
   npm run start:windows
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api
   - Health Check: http://localhost:3001/api/health

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   npm run docker:run
   ```

2. **Or use the deployment script**
   ```bash
   npm run deploy:dev
   ```

## Usage

### Creating Feature Requests

1. Navigate to the "Feature Requests" page
2. Enter a natural language description of the feature you want
3. Submit the request
4. Watch as the system processes your request and generates new UI components
5. See the new feature appear in your dashboard

Example requests:
- "I want a chart that shows CPU usage over time"
- "Add a table displaying recent workflow executions"
- "Create a button that triggers system health checks"

### Creating Workflows

1. Go to the "Workflow Builder" page
2. Describe your workflow in natural language
3. The system will automatically:
   - Parse your description
   - Generate workflow specifications
   - Create the necessary backend code
   - Schedule the workflow for execution

Example workflows:
- "Send me a daily email with system metrics at 9 AM"
- "Check disk space every hour and alert if it's above 80%"
- "Generate a weekly report of all workflow executions"

### Monitoring and Alerts

The system includes comprehensive monitoring:

- **System Metrics**: CPU, memory, and performance tracking
- **Workflow Monitoring**: Execution status, duration, and error tracking
- **Alert Management**: Configurable rules with multiple severity levels
- **Real-time Updates**: Live dashboard updates via WebSocket

## API Documentation

### Core Endpoints

- `GET /api/health` - System health check
- `GET /api/dashboard/data` - Dashboard data aggregation
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/features/requests` - List feature requests
- `POST /api/features/request` - Submit feature request
- `GET /api/monitoring/metrics` - System metrics
- `GET /api/monitoring/alerts` - System alerts

### WebSocket Events

- `workflowStatusUpdate` - Workflow execution status changes
- `featureRequestUpdate` - Feature request processing updates
- `systemMetricsUpdate` - Real-time system metrics
- `alert` - New system alerts

## Configuration

### Environment Variables

#### Backend Configuration
- `NODE_ENV` - Environment (development/staging/production)
- `PORT` - Server port (default: 3001)
- `DATABASE_PATH` - SQLite database file path
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `LOG_DIRECTORY` - Log files directory
- `ENABLE_EMAIL_ALERTS` - Enable email notifications
- `ALERT_EMAIL_RECIPIENTS` - Comma-separated email list

#### Frontend Configuration
- `VITE_API_URL` - Backend API URL

### Logging Configuration

The system supports structured logging with:
- Multiple output targets (console, file)
- Configurable log levels
- Automatic log rotation
- Performance monitoring integration

### Alert Configuration

Customize alerting with:
- Resource usage thresholds
- Workflow failure notifications
- Custom alert rules
- Multiple notification channels

## Deployment

### Development
```bash
npm run deploy:dev
```

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy:prod
```

### Manual Docker Deployment
```bash
# Build the image
docker build -t workflow-automator .

# Run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

## Database Management

### Initialize Database
```bash
cd backend
npm run db:init
```

### Run Migrations
```bash
cd backend
npm run db:migrate:up
```

### Check Migration Status
```bash
cd backend
npm run db:migrate:status
```

### Rollback Migrations
```bash
cd backend
npm run db:migrate:down 1
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Frontend Tests
```bash
npm run test:frontend
```

### Run Backend Tests
```bash
npm run test:backend
```

### Run E2E Tests
```bash
npm run test:e2e
```

## Development

### Project Structure
```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API and utility services
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript type definitions
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # Business logic services
│   │   ├── repositories/    # Data access layer
│   │   ├── hooks/           # Kiro hook implementations
│   │   └── scripts/         # Utility scripts
├── scripts/                  # Deployment and utility scripts
└── docker-compose.yml       # Container orchestration
```

### Adding New Features

1. **UI Features**: Submit a feature request through the application
2. **Workflows**: Use the workflow builder to create new automations
3. **Manual Development**: Follow standard React/Node.js development practices

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port in environment variables
   - Kill existing processes using the ports

2. **Database Connection Issues**
   - Ensure the data directory exists and is writable
   - Check database file permissions

3. **WebSocket Connection Failures**
   - Verify firewall settings
   - Check CORS configuration

4. **Build Failures**
   - Clear node_modules and reinstall dependencies
   - Check Node.js and npm versions

### Logs and Debugging

- Application logs: `./backend/logs/`
- Docker logs: `docker-compose logs -f`
- Browser console for frontend issues
- Network tab for API debugging

### Performance Issues

- Monitor system metrics in the dashboard
- Check alert notifications
- Review performance logs
- Scale resources if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review application logs
- Submit issues through the repository
- Use the built-in monitoring and alerting features

## Project Structure

```
├── frontend/          # React frontend with Vite and Tailwind CSS
├── backend/           # Node.js backend with Express
├── package.json       # Root package.json for workspace management
└── README.md         # This file
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **SQLite** - Database
- **Jest** - Testing framework

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

### Development

1. Start both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

### Individual Services

Start frontend only:
```bash
npm run dev:frontend
```

Start backend only:
```bash
npm run dev:backend
```

### Building

Build both frontend and backend:
```bash
npm run build
```

### Testing

Run all tests:
```bash
npm run test
```

## API Endpoints

- `GET /api/health` - Health check endpoint

## Database

The application uses SQLite with the following tables:
- `workflows` - Workflow definitions and metadata
- `execution_logs` - Workflow execution history
- `feature_requests` - User feature requests
- `system_metrics` - System performance metrics

The database file is created at `backend/data/database.sqlite` on first run.