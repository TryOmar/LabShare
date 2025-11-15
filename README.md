# LabShare - ITI Share Solutions

A collaborative platform for ITI students to share and view lab solutions. Built with Next.js 16, React 19, TypeScript, Supabase, and Tailwind CSS.

## 🚀 Features

- **Secure Authentication**: OTP-based email authentication with persistent sessions (30-day cookies)
- **Lab Management**: Browse labs by course and track
- **Solution Sharing**: Upload and share lab solutions with code files
- **Version Control**: Multiple versions of submissions with file management
- **Comments System**: Comment on submissions with markdown support
- **View Tracking**: Track how many times your solutions are viewed
- **Access Control**: Lab unlocking system - submit your solution to unlock others
- **Server-Side Security**: All database operations validated server-side with proper authorization

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom OTP flow with httpOnly cookies
- **Email**: Resend
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account and project
- Resend account (for email OTP)
- PostgreSQL database (via Supabase)

## 🔧 Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd LabShare
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend (for email OTP)
RESEND_API_KEY=your_resend_api_key

# Node Environment
NODE_ENV=development
```

### 4. Database Setup

Run the database migrations:

```bash
npm run db:migrate
```

This will execute the SQL scripts in the `scripts/` directory:
- `001_create_schema.sql` - Creates database schema
- `002_seed_data.sql` - Seeds initial data
- `003_fix_timestamps_utc.sql` - Fixes timestamp timezone issues

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
LabShare/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (server-side)
│   │   ├── auth/         # Authentication endpoints
│   │   ├── dashboard/    # Dashboard data
│   │   ├── lab/          # Lab endpoints
│   │   ├── labs/         # Labs listing
│   │   └── submission/   # Submission endpoints
│   ├── dashboard/         # Dashboard page
│   ├── lab/              # Lab detail pages
│   ├── labs/             # Labs listing page
│   ├── login/            # Login page
│   └── submission/       # Submission detail pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── navigation.tsx    # Navigation bar
│   └── comments-section.tsx
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # General utilities
├── scripts/               # Database migration scripts
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔐 Security Features

- **Server-Side Validation**: All database queries run server-side with authentication checks
- **HttpOnly Cookies**: Secure cookie-based authentication (30-day expiration)
- **Authorization Checks**: Users can only access/modify their own data
- **Input Validation**: Server-side validation for all API routes
- **SQL Injection Protection**: Using Supabase client with parameterized queries

## 🎯 API Routes

All API routes require authentication via httpOnly cookies:

- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout user
- `GET /api/dashboard` - Get dashboard data
- `GET /api/labs` - Get labs for authenticated student
- `GET /api/lab/[id]` - Get specific lab data
- `GET /api/submission/[id]` - Get submission details
- `POST /api/submission/upload` - Upload/update submission
- `DELETE /api/submission/[id]` - Delete submission
- `GET /api/submission/[id]/comments` - Get comments
- `POST /api/submission/[id]/comments` - Add comment
- `DELETE /api/submission/[id]/comments/[commentId]` - Delete comment

## 📝 Database Schema

Key tables:
- `students` - Student information
- `tracks` - ITI tracks
- `courses` - Course information
- `labs` - Lab assignments
- `submissions` - Student submissions
- `submission_versions` - Version history
- `submission_files` - Code files
- `comments` - Comments on submissions
- `auth_codes` - OTP codes for authentication
- `lab_unlocks` - Track which labs students have unlocked

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `NODE_ENV=production`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- ITI Development Team

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database powered by [Supabase](https://supabase.com/)
- Email service by [Resend](https://resend.com/)

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Note**: This is a private project for ITI students. Unauthorized access is prohibited.

