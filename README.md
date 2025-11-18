# LabShare - ITI Share Solutions

A collaborative platform for ITI students to share and view lab solutions. Built with Next.js 16, React 19, TypeScript, Supabase, and Tailwind CSS.

## 🚀 Features

- **Secure Authentication**: OTP-based email authentication with persistent sessions (30-day cookies)
- **Terms & Conditions**: First-time users must accept terms before accessing the platform
- **Lab Management**: Browse labs by course and track with many-to-many course-track relationships
- **Solution Sharing**: Upload and share lab solutions with code files and file attachments
- **Dual File Support**: 
  - **Code Files**: Direct code editing with syntax highlighting (JavaScript, TypeScript, Python, C++, Java, etc.)
  - **File Attachments**: Upload PDFs, images, and other files stored in Supabase Storage
- **Comments System**: Comment on submissions with markdown support (bold, code blocks, inline code)
- **View Tracking**: Track how many times your solutions are viewed
- **Access Control**: Lab unlocking system - submit your solution to unlock others
- **Date & Time Display**: All dates show both date and time (hours and minutes)
- **Server-Side Security**: All database operations validated server-side with proper authorization

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for file attachments)
- **Authentication**: Custom OTP flow with httpOnly cookies
- **Email**: Resend
- **Syntax Highlighting**: react-syntax-highlighter
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
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Required for storage operations

# Resend (for email OTP)
RESEND_API_KEY=your_resend_api_key

# Database (optional - for migration script)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:[PORT]/postgres

# Node Environment
NODE_ENV=development
```

### 4. Supabase Storage Setup

Create a storage bucket in Supabase:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `submission-attachments`
3. Set it to **Public** (or configure RLS policies as needed)
4. Enable the bucket for file uploads

### 5. Database Setup

Run the database migrations:

```bash
npm run db:migrate
```

This will execute the SQL scripts in the `scripts/` directory in order:
- `001_create_schema.sql` - Creates database schema with all tables and RLS policies
- `002_seed_data.sql` - Seeds initial data (tracks, courses, labs, students)
- `003_fix_timestamps_utc.sql` - Fixes timestamp timezone issues
- `004_remove_versions_separate_code_attachments.sql` - Migration to separate code files from attachments

**Note**: See `scripts/README.md` for detailed migration instructions and alternative methods.

### 6. Run the development server

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
│   │   │   ├── accept-terms/  # Terms acceptance
│   │   │   ├── check-terms/   # Terms verification
│   │   │   ├── logout/       # Logout
│   │   │   ├── status/       # Auth status
│   │   │   ├── request-otp/  # Request OTP
│   │   │   ├── send-otp/     # Send OTP email
│   │   │   └── verify-otp/   # Verify OTP code
│   │   ├── dashboard/    # Dashboard data
│   │   ├── lab/          # Lab endpoints
│   │   ├── labs/         # Labs listing
│   │   └── submission/   # Submission endpoints
│   │       └── [id]/
│   │           ├── comments/  # Comment management
│   │           └── route.ts   # Submission CRUD
│   ├── dashboard/         # Dashboard page
│   ├── lab/              # Lab detail pages
│   │   └── [id]/
│   │       ├── locked/   # Locked lab page
│   │       └── page.tsx  # Lab detail page
│   ├── labs/             # Labs listing page
│   ├── login/             # Login page
│   ├── terms/             # Terms & conditions page
│   ├── submission/        # Submission detail pages
│   │   └── [id]/page.tsx
│   ├── last-updates/      # Changelog page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects)
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix UI)
│   ├── navigation.tsx    # Navigation bar
│   ├── comments-section.tsx  # Comments component
│   ├── last-updates.tsx  # Changelog component
│   └── theme-provider.tsx
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── storage.ts        # Storage operations (Supabase)
│   ├── supabase/         # Supabase clients
│   │   ├── client.ts     # Client-side client
│   │   ├── server.ts     # Server-side client
│   │   ├── middleware.ts # Middleware client
│   │   └── service.ts    # Service role client
│   └── utils.ts          # General utilities (formatDateTime, etc.)
├── scripts/               # Database migration scripts
│   ├── 001_create_schema.sql
│   ├── 002_seed_data.sql
│   ├── 003_fix_timestamps_utc.sql
│   ├── 004_remove_versions_separate_code_attachments.sql
│   ├── run-migrations.js  # Migration runner
│   └── README.md         # Migration guide
├── data/                  # Static data
│   └── lastUpdates.ts     # Changelog data
├── hooks/                 # React hooks
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔐 Security Features

- **Server-Side Validation**: All database queries run server-side with authentication checks
- **HttpOnly Cookies**: Secure cookie-based authentication (30-day expiration)
- **Terms Acceptance**: First-time users must accept terms before accessing the platform
- **Authorization Checks**: Users can only access/modify their own data
- **Input Validation**: Server-side validation for all API routes
- **SQL Injection Protection**: Using Supabase client with parameterized queries
- **Row Level Security (RLS)**: All tables have RLS policies enabled
- **File Upload Security**: Filename sanitization and path validation

## 🎯 API Routes

All API routes require authentication via httpOnly cookies (except login/OTP endpoints):

### Authentication
- `POST /api/auth/request-otp` - Request OTP code
- `POST /api/auth/send-otp` - Send OTP email
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/check-terms` - Check if terms are accepted
- `POST /api/auth/accept-terms` - Accept terms and conditions
- `POST /api/auth/logout` - Logout user

### Dashboard & Labs
- `GET /api/dashboard` - Get dashboard data (student, track, courses, recent submissions)
- `GET /api/labs` - Get labs for authenticated student (grouped by course)
- `GET /api/lab/[id]` - Get specific lab data with submissions

### Submissions
- `GET /api/submission/[id]` - Get submission details (with code files and attachments)
- `POST /api/submission/upload` - Upload/update submission (code files + attachments)
- `DELETE /api/submission/[id]` - Delete submission (and associated files)

### Comments
- `GET /api/submission/[id]/comments` - Get comments for a submission
- `POST /api/submission/[id]/comments` - Add a comment
- `DELETE /api/submission/[id]/comments/[commentId]` - Delete a comment

## 📝 Database Schema

### Core Tables
- `students` - Student information (name, email, track_id)
- `tracks` - ITI tracks (code, name)
- `courses` - Course information (name, description)
- `course_track` - Many-to-many relationship between courses and tracks
- `labs` - Lab assignments (course_id, lab_number, title, description)
- `auth_codes` - OTP codes for authentication (student_id, code, expires_at, used)

### Submission Tables
- `submissions` - Student submissions (student_id, lab_id, title, view_count)
- `submission_code` - Code files (submission_id, filename, language, content)
- `submission_attachments` - File attachments stored in Supabase Storage (submission_id, filename, storage_path, mime_type, file_size)

### Interaction Tables
- `comments` - Comments on submissions (submission_id, student_id, content)
- `lab_unlocks` - Track which labs students have unlocked (student_id, lab_id, unlocked_at)

### Key Relationships
- Students belong to one Track (many-to-one)
- Courses can belong to multiple Tracks (many-to-many via `course_track`)
- Labs belong to one Course (many-to-one)
- Submissions belong to one Student and one Lab (one-to-one per student-lab)
- Submissions have multiple Code Files and Attachments (one-to-many)
- Submissions have multiple Comments (one-to-many)
- Lab unlocks track which labs a student can access (many-to-many)

## 🗄️ Storage

The application uses Supabase Storage for file attachments:

- **Bucket**: `submission-attachments`
- **Structure**: `submissions/{submissionId}/{filename}`
- **File Types**: PDFs, images, documents, and other non-code files
- **Code Files**: Stored directly in database (`submission_code` table) for syntax highlighting

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
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NODE_ENV=production`
- `DATABASE_URL` (optional, for migrations)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations

## 🔄 Migration History

The database has evolved through several migrations:

1. **001_create_schema.sql** - Initial schema creation
2. **002_seed_data.sql** - Initial data seeding
3. **003_fix_timestamps_utc.sql** - UTC timestamp fixes
4. **004_remove_versions_separate_code_attachments.sql** - Removed version system, separated code files from attachments

## 🎨 UI Features

- **Syntax Highlighting**: Code files support multiple languages with Prism.js
- **Markdown Support**: Comments support bold (`**text**`), inline code (`` `code` ``), and code blocks (``` ```code``` ```)
- **Date Formatting**: All dates display with time (e.g., "12/25/2023, 3:45 PM")
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Dark Mode Ready**: Theme provider included (can be enabled)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Contributors are credited in the "Last Updates" section on the dashboard.

## 📄 License

This project is private and proprietary.

## 👥 Authors

- ITI Development Team

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database powered by [Supabase](https://supabase.com/)
- Email service by [Resend](https://resend.com/)
- Syntax highlighting by [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

## 📞 Support

For issues and questions, please open an issue in the repository or contact the development team.

---

**Note**: This is a private project for ITI students. Unauthorized access is prohibited.
