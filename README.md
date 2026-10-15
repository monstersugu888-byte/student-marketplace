# 🎓 CampusMate - Student Productivity & Marketplace Portal

**CampusMate** is an all-in-one student productivity and campus management web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Google Cloud Firestore**.

---

## 🚀 Key Features

- 📊 **Smart Dashboard**: Daily timetable, upcoming assignment deadline cards, attendance gauge, daily checklist, study resources, and marketplace highlights.
- 📚 **Assignment Manager**: Filter by Subject, Priority (Low, Medium, High), and Status (Not Started, In Progress, Completed). Full CRUD support with modal dialogs.
- 📅 **Timetable & Calendar**: Weekly class matrix, day-by-day timetable view, and personal study session planner.
- 📈 **Attendance Tracker**: Subject-wise percentage tracker with 75% minimum threshold warning, smart absence calculator (*"Can miss N classes"* / *"Must attend N classes"*), and quick Present/Absent logging.
- 📂 **Study Materials Library**: Course and semester filterable resource library with bookmarking, simulated downloads, and upload modals.
- 🛍️ **Student Marketplace**: Category-filtered student marketplace (Books, Electronics, Stationery, Lab Equipment, Hostel Essentials) with condition tags, seller contact modals, and listing moderation.
- 🔔 **Notification Center**: Deadline reminders, schedule change alerts, and campus announcements.
- 👤 **Student Profile & Settings**: Editable student profile, academic GPA tracker, notification preferences, and Dark/Light mode theme switch.
- ☁️ **Cloud Firestore Backend**: Server-side Next.js API route handlers using Firebase Admin SDK with personalized, isolated user data storage.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (`lucide-react`)
- **Backend & Database:** Google Cloud Firestore via `firebase-admin`
- **Fonts:** Plus Jakarta Sans & Inter

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/monstersugu888-byte/student-marketplace.git
cd student-marketplace
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/             # Next.js Server API Routes (Firestore Backend)
│   │   ├── assignments/     # Assignment Management Page
│   │   ├── attendance/      # Attendance Tracker Page
│   │   ├── auth/            # Login & Register Pages
│   │   ├── marketplace/     # Student Marketplace Page
│   │   ├── materials/       # Study Materials Library
│   │   ├── notifications/   # Notification Center
│   │   ├── profile/         # Profile & Settings Page
│   │   ├── timetable/       # Timetable & Calendar Page
│   │   ├── layout.tsx       # Root Layout
│   │   ├── page.tsx         # Smart Dashboard Page
│   │   └── globals.css      # Design System Tokens & Styling
│   ├── components/
│   │   ├── common/          # Modals, Toasts & Reusable UI
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── layout/          # Sidebar, Header, MobileBottomNav
│   │   └── modals/          # Quick Add Modals
│   ├── context/             # AppContext & State Persistence
│   ├── data/                # Initial Mock & Demo Data
│   ├── lib/                 # Firebase Admin Firestore SDK configuration
│   └── types/               # TypeScript Data Interfaces
```


## Teacher access approval email setup

Teacher registrations remain pending until an administrator approves them. The registration route sends a Resend notification to `moonjikko2@gmail.com`; the email links open a confirmation page, and a server-side action updates Supabase Auth `app_metadata`. Student registration and student login remain separate.

Configure these values in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if you test there):

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (already used by the app)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable/anon key (already used by the app)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase service-role key; never use a `NEXT_PUBLIC_` prefix
- `RESEND_API_KEY` — API key from Resend
- `RESEND_FROM_EMAIL` — sender address verified in Resend, e.g. `CampusMate <no-reply@your-verified-domain>`
- `TEACHER_APPROVAL_SECRET` — a long random secret used to sign expiring approval tokens (at least 32 random bytes)

After saving variables, redeploy the production deployment. Approval links expire after 3 days and require a confirmation click. The server accepts decisions only while the account is still pending. Email delivery requires a verified Resend sender/domain. Do not commit real secrets to GitHub.
