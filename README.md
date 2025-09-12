# Ads Reporting Software

A comprehensive ads reporting and analytics platform built with Next.js (React) frontend and Node.js/Express backend.

## Project Structure

```
ads-reporting-software/
├── backend/               # Node.js/Express API server
│   ├── config/           # Database and app configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── .env             # Environment variables
│   ├── app.js           # Express app configuration
│   ├── server.js        # Server entry point
│   └── database.sql     # Database schema
├── frontend/            # Next.js React application
│   ├── app/            # Next.js app directory
│   │   ├── auth/       # Authentication pages
│   │   ├── dashboard/  # Dashboard page
│   │   ├── ads/        # Ads management pages
│   │   ├── reports/    # Reports pages
│   │   └── components/ # Reusable components
│   ├── public/         # Static files
│   └── package.json    # Frontend dependencies
└── README.md           # This file
```

## Prerequisites

- Node.js (v14 or higher)
- MySQL (via XAMPP or standalone)
- npm or yarn

## Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database or run the SQL script:

```bash
# Using MySQL command line
mysql -u root -p < backend/database.sql
```

Or manually:
- Create database named `ads_reporting`
- Run the SQL commands from `backend/database.sql`

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- The `.env` file is already configured with:
  - Database: `ads_reporting`
  - User: `root`
  - Password: `root`
  - Port: `5000`

4. Start the backend server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The backend API will be available at `http://localhost:5000`

## Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users (Protected)
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Ads (Protected)
- `GET /api/ads` - Get all ads
- `GET /api/ads/:id` - Get ad by ID
- `POST /api/ads` - Create new ad (Admin/Manager)
- `PUT /api/ads/:id` - Update ad (Admin/Manager)
- `DELETE /api/ads/:id` - Delete ad (Admin/Manager)
- `GET /api/ads/:id/stats` - Get ad statistics

### Reports (Protected)
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report by ID
- `POST /api/reports/generate` - Generate new report
- `DELETE /api/reports/:id` - Delete report (Admin only)
- `GET /api/reports/:id/export` - Export report

## Features

### Backend
- ✅ Express.js REST API
- ✅ MySQL database with connection pooling
- ✅ JWT authentication
- ✅ Role-based access control (Admin, Manager, User)
- ✅ Error handling middleware
- ✅ CORS configuration
- ✅ Environment variables

### Frontend
- ✅ Next.js 13+ with App Router
- ✅ TypeScript support
- ✅ Tailwind CSS for styling
- ✅ React Hook Form for form handling
- ✅ Axios for API calls
- ✅ React Query for data fetching
- ✅ Authentication pages (Login/Register)
- ✅ Protected dashboard
- ✅ Responsive design

## Default Credentials

For testing, you can register a new user through the registration page or use the API.

## Development

### Running Both Frontend and Backend

You can run both servers simultaneously:

1. Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

2. Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
npm start
```

Backend:
```bash
cd backend
npm start
```

## Environment Variables

### Backend (.env)
- `DB_HOST` - Database host (localhost)
- `DB_USER` - Database user (root)
- `DB_PASSWORD` - Database password (root)
- `DB_NAME` - Database name (ads_reporting)
- `DB_PORT` - Database port (3306)
- `PORT` - Server port (5000)
- `JWT_SECRET` - JWT secret key
- `CLIENT_URL` - Frontend URL for CORS

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name

## Troubleshooting

### Database Connection Issues
- Ensure XAMPP MySQL is running
- Check database credentials in `.env`
- Verify database `ads_reporting` exists
- Run the SQL script to create tables

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Next.js will automatically use the next available port

### CORS Issues
- Ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Check CORS configuration in `app.js`

## License

ISC

## Support

For issues or questions, please create an issue in the project repository.
