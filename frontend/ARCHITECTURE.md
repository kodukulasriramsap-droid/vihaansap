# Sri Vihaan SAP Platform - Master Architecture Blueprint

## 1. Overall Platform Architecture
The Sri Vihaan SAP Platform is a unified, multi-portal web application composed of four interconnected systems. It operates on a single codebase (React/Vite) but enforces strict layout, routing, and access separation between the portals.

*   **Public Website:** The marketing and conversion engine. It is publicly accessible and optimized for SEO.
*   **Student Portal:** The learning management system (LMS) for enrolled students to access courses, classes, materials, and support.
*   **Mentor Portal:** A dedicated workspace for instructors to manage their assigned batches, schedule live sessions, upload recordings/materials, and answer student doubts.
*   **Admin Portal:** The central operating system (OS) of the institute. It manages users, courses, batches, content management (CMS), and system settings.

All systems will eventually be powered by a unified backend using Firebase (Authentication, Firestore, and Cloud Storage).

## 2. Module Relationships

*   **Public Website ↔ Admin Portal (CMS):** The Admin Portal acts as a Headless CMS for the Public Website. Sections like Blogs, Reviews, FAQ, Courses, and Home Page details read directly from Firestore collections managed by the Admin.
*   **Admin Portal ↔ Mentor Portal:** Admins create Mentors, create Courses, and assign Mentors to Batches. Mentors can only view and manage the specific Batches assigned to them.
*   **Admin/Mentor Portal ↔ Student Portal:** Admins assign Students to Batches. Once assigned, the Student Portal dynamically populates with the Course details, Live Classes, Recordings, and Materials associated with that Batch.

### Batch Architecture
The `Batch` is the central operational unit connecting students, mentors, and content.
*   **Course:** The abstract template (e.g., "SAP FICO").
*   **Batch:** A specific instance of a Course running at a given time (e.g., "SAP FICO - Morning Batch - June 2026").
    *   **Mentors:** Assigned to teach the Batch.
    *   **Students:** Enrolled in the Batch.
    *   **Live Sessions:** Scheduled events specifically for this Batch.
    *   **Materials & Recordings:** Resources tied directly to the progress of this Batch.

### Course Architecture
*   **Course** -> Contains meta-information (Title, Description, Price, Cover Image).
    *   **Modules** -> Logical breakdown of the curriculum.
        *   **Sessions** -> Individual topics within a module.
    *   **FAQ & Reviews** -> Marketing data attached to the course for the public website.
    *   **Upcoming Batches** -> Scheduled instances of the course.

## 3. Data Flow
The platform relies on a unidirectional data flow from the backend services to the UI components.
1.  **Firebase Firestore** acts as the single source of truth.
2.  **Service Layer (e.g., `CourseService`, `AuthService`)** encapsulates all database interactions.
3.  **Custom Hooks (e.g., `useCourses`, `useAuth`)** subscribe to services, handle loading states, and provide data to the UI.
4.  **UI Components** are strictly presentation layers that consume data from hooks. They never query the database directly.

## 4. User Flow (Student Lifecycle)
1.  **Registration:** Student registers via Google Login or Email/Password on the Public Website.
2.  **Pending Approval:** The account is created as a "Demo Student" or "Pending". They can access the portal but see limited/demo content.
3.  **Admin Action:** Admin verifies payment/enrollment and assigns the Student to a specific `Batch`.
4.  **Approved & Active:** The student's role upgrades to "Paid Student".
5.  **Learning Phase:** Student accesses Live Classes, Recordings, and Study Materials in the Student Portal, specific to their assigned Batch.
6.  **Support:** Student submits "Doubts" which are routed to the assigned Mentor.
7.  **Completion:** Course is marked completed. Student submits a Review (moderated by Admin before appearing on the Public Website).
8.  **Post-Completion (Future):** Certificate generation and Alumni placement tracking.

## 5. Permission System
Role-based Access Control (RBAC) enforced at both the Router level and Database (Firestore Rules) level.

*   **Super Admin:** Full access to everything, including deleting Admin accounts and modifying core platform settings.
*   **Admin:** Access to all Admin Portal modules (Users, Courses, CMS, Analytics). Cannot modify Super Admin accounts.
*   **Mentor:** Access limited to the Mentor Portal. Can only view and edit data related to their explicitly assigned Batches. Can upload materials, schedule live classes, and respond to doubts for their students.
*   **Paid Student:** Access limited to the Student Portal. Can only view content related to the Batches they are actively enrolled in. Can submit doubts.
*   **Demo Student:** Access limited to the Student Portal. Can only view preview content, public notifications, or "More Courses" catalogs. Cannot join live classes.

## 6. Routing Structure
The application is partitioned into distinct route branches with separate layouts and route guards.

```text
/                   -> Public Layout (Header, Navbar, Footer)
  /courses          -> Public Website Routes
  /blogs            -> Public Website Routes
  /about            -> Public Website Routes

/auth               -> Auth Layout (Minimal layout for login/register)
  /login            -> Shared Login Page (or portal-specific logins)
  /register

/student            -> Student Layout (Sidebar, Topbar) + StudentGuard
  /student/dashboard
  /student/courses
  ...

/mentor             -> Mentor Layout (Sidebar, Topbar) + MentorGuard
  /mentor/dashboard
  /mentor/batches
  ...

/admin              -> Admin Layout (Sidebar, Topbar) + AdminGuard
  /admin/dashboard
  /admin/users
  /admin/cms
  ...
```

## 7. Firestore Collection Plan

*   `users`: Shared collection for all roles.
    *   Fields: `uid`, `name`, `email`, `role`, `avatarUrl`, `createdAt`, `status`.
*   `courses`: Course templates.
    *   Fields: `title`, `slug`, `description`, `syllabus`, `thumbnailUrl`, `isPublished`.
*   `batches`: Instances of courses.
    *   Fields: `courseId`, `mentorIds` (array), `studentIds` (array), `startDate`, `schedule`, `status`.
*   `sessions`: Live classes and events.
    *   Fields: `batchId`, `title`, `date`, `time`, `meetingLink`, `status` (upcoming, live, completed).
*   `materials`: Uploaded files and resources.
    *   Fields: `batchId`, `title`, `type` (PDF, Video), `fileUrl`, `uploadedBy` (mentorId), `createdAt`.
*   `recordings`: Video archives.
    *   Fields: `batchId`, `title`, `videoUrl`, `dateRecorded`.
*   `doubts`: Q&A ticketing system.
    *   Fields: `studentId`, `batchId`, `mentorId`, `question`, `answer`, `status`.
*   `cms_pages`: Data for the public website.
    *   Documents: `home`, `about`, `faq`, `contact`.
*   `blogs`: Public blog posts.
    *   Fields: `title`, `slug`, `content`, `authorId`, `coverImage`, `isPublished`.
*   `reviews`: Student testimonials.
    *   Fields: `studentId`, `courseId`, `rating`, `comment`, `isApproved` (Admin controls visibility).

## 8. Scalability Plan
The architecture is designed to be modular. New features operate as vertical slices.
*   **Separation of Concerns:** The Service Layer pattern allows swapping Firebase for another backend (e.g., PostgreSQL/Node.js) without touching React components.
*   **Lazy Loading:** Portals (Admin, Mentor, Student) will be lazy-loaded using React `Suspense`. A student downloading the app won't load Admin portal JavaScript, keeping performance high.
*   **Independent Feature Folders:** Features like "Payments" or "Exams" will have their own dedicated folders containing components, types, and hooks, preventing monolithic spaghetti code.

## 9. Folder Structure Recommendation
```text
/src
  /assets
  /components           # Shared UI components (Buttons, Modals)
  /hooks                # Global hooks
  /services             # Firebase abstraction layer
    AuthService.ts
    CourseService.ts
  /types                # Shared TypeScript interfaces
  /utils                # Helpers, formatting
  /public_web           # Public Website Module
    /pages
    /components
  /student              # Student Portal Module
    /pages
    /layout
    /components
  /mentor               # Mentor Portal Module (Future)
  /admin                # Admin Portal Module (Future)
```

## 10. Future Expansion Strategy
Because of the decoupled nature of the Service layer and the modular folder structure, adding future features is straightforward:
*   **Assignments & Exams:** Create a new `assignments` collection. Add an `Assignments` page to Student/Mentor portals.
*   **Attendance Tracking:** Add an `attendance` sub-collection to `batches`. Mentors mark attendance; Students view their stats.
*   **Payments:** Integrate Stripe/Razorpay on the Public Website. Upon successful webhook, an Admin Service updates the user's role to "Paid Student" and auto-enrolls them in a Batch.
*   **AI Chat:** Integrate Google Gemini via a new `AIAssistantService` available exclusively in the Student Portal for 24/7 basic query resolution.
*   **Mobile App:** The Service Layer (`/src/services`) and Types (`/src/types`) can be directly shared or mirrored into a React Native codebase in the future.
