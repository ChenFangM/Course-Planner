# University Course Planner

A comprehensive web application for semester-by-semester course planning, built with React, TypeScript, and Supabase.

## Features

- Secure user authentication with Supabase
- Interactive semester-by-semester course planning
- Customizable number of semesters (4-12)
- Course information tracking:
  - Course code and name
  - Credit hours
  - Required/elective status
  - Grades
- Real-time course search and filtering
- Modern, responsive UI with Material-UI components

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Setup

1. Clone the repository and install dependencies:
```bash
cd course-planner
npm install
```

2. Set up your Supabase database:
   - Create a new Supabase project
   - Execute the SQL commands from `src/lib/schema.sql` in your Supabase SQL editor
   - This will create the necessary tables and set up row-level security policies

3. Configure environment variables:
   Copy `.env` file and update with your credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Sign up or log in to your account
2. Navigate to the Course Plan page to:
   - View and edit your semester-by-semester course plan
   - Add/remove courses
   - Adjust the number of semesters
   - Update course details and grades

3. Use the Course Browser page to:
   - Browse available courses
   - Add courses to your plan
   - Filter courses by code or name

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- Material-UI for polished UI components
- Supabase for:
  - User authentication
  - PostgreSQL database
  - Row Level Security
- React Router for navigation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
