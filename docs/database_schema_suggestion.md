# Unified Church Management & Course Learning Database Schema

This document outlines the fully merged schema combining the **Learning Management System (Courses, Lessons, Grading)** features with **Church Management (Departments, Cell Groups, Events, Articles)**, incorporating the detailed multi-level Role-Based Access Control (RBAC). The database uses PostgreSQL.

## 1. System Architecture Overview
* **Authentication & RBAC**: A user belongs to a single Role (e.g., admin, user). Roles map to Actions and Resources via `RolePermission`.
* **LMS Content**: Hierarchy is flattened to `Course` -> `Lesson`. Lessons contain `QuestionTemplate`s which form `Test`s.
* **Grading & Tracking**: Tracks user progress, scores, and status via `LessonGrade` and `CourseGrade` (replacing gamified elements like XP/mastery). Continues to track `LearningSession`, `TestAttempt`, and `QuestionSnapshot`s.
* **Church Operations**: Groups users into `Department`s and `CellGroup`s. Schedules `Event`s with attendance tracking, and manages `Article`s.
* **Notifications & Alerts**: Enables Admins to push announcements to all users, specific departments, or targeted individuals. Also supports automated system pings (e.g., event reminders).

## 2. Complete Prisma Schema (`schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------
// 1. AUTHENTICATION & RBAC
// ---------------------------------------------------------

enum PrayerVisibility {
  public
  private
  shared
}

enum PrayerStatus {
  open
  closed
}

model User {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  username      String        @unique @db.VarChar(50)
  email         String        @unique @db.VarChar(255)
  password_hash String
  role_id       Int
  role          Role          @relation(fields: [role_id], references: [id])
  created_at    DateTime      @default(now()) @db.Timestamptz
  
  // Relations to LMS content & tracking
  courses_created   Course[]
  lessons_created   Lesson[]
  test_attempts     TestAttempt[]
  learning_sessions LearningSession[]
  lesson_grades     LessonGrade[]
  course_grades     CourseGrade[]
  evidence          ActivityEvidence[]
  audit_logs        AuditLog[]

  // Relations to Church Management
  profile           Profile?
  department_led    Department[]        @relation("DepartmentLeader")
  departments       DepartmentMember[]
  cellgroups_led    CellGroup[]         @relation("CellGroupLeader")
  cellgroups        CellGroupMember[]
  events_created    Event[]
  attendances       EventAttendance[]
  articles          Article[]
  notifications_sent    Notification[]          @relation("NotificationSender")
  notifications_inbox   NotificationRecipient[]

  // Prayer relations
  prayers_created   Prayer[]
  prayers_shared_with PrayerShare[]

  @@map("users")
}

model Prayer {
  id            String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title         String?           @db.VarChar(255)
  content       String            @db.Text
  visibility    PrayerVisibility  @default(private)
  status        PrayerStatus      @default(open)
  close_reason  String?           @db.Text
  created_by    String            @db.Uuid
  created_at    DateTime          @default(now()) @db.Timestamptz
  updated_at    DateTime          @default(now()) @updatedAt @db.Timestamptz
  closed_at     DateTime?         @db.Timestamptz

  creator       User              @relation(fields: [created_by], references: [id], onDelete: Cascade)
  shared_with   PrayerShare[]

  @@index([created_by])
  @@index([visibility])
  @@index([status])
  @@map("prayers")
}

model PrayerShare {
  prayer_id     String    @db.Uuid
  user_id       String    @db.Uuid
  shared_at     DateTime  @default(now()) @db.Timestamptz

  prayer        Prayer    @relation(fields: [prayer_id], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([prayer_id, user_id])
  @@index([user_id])
  @@map("prayer_shares")
}

model Profile {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id       String    @unique @db.Uuid
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  first_name    String    @db.VarChar(100)
  last_name     String    @db.VarChar(100)
  phone         String?   @db.VarChar(20)
  address       String?   @db.Text
  date_of_birth DateTime? @db.Date
  gender        String?   @db.VarChar(10) // e.g., MALE, FEMALE

  @@map("profiles")
}

model Role {
  id                  Int               @id @default(autoincrement())
  name                String            @unique @db.VarChar(50) // e.g., "admin", "student"
  permissions         RolePermission[]
  users               User[]

  @@map("roles")
}

model Action {
  id          Int              @id @default(autoincrement())
  name        String           @unique @db.VarChar(50)
  permissions RolePermission[]

  @@map("actions")
}

model Resource {
  id          Int              @id @default(autoincrement())
  name        String           @unique @db.VarChar(50)
  permissions RolePermission[]

  @@map("resources")
}

model RolePermission {
  id          Int      @id @default(autoincrement())
  role_id     Int
  action_id   Int
  resource_id Int

  role     Role     @relation(fields: [role_id], references: [id], onDelete: Cascade)
  action   Action   @relation(fields: [action_id], references: [id], onDelete: Cascade)
  resource Resource @relation(fields: [resource_id], references: [id], onDelete: Cascade)

  @@unique([role_id, action_id, resource_id])
  @@map("role_permissions")
}

// ---------------------------------------------------------
// 2. EDUCATION HIERARCHY (Courses -> Lessons)
// ---------------------------------------------------------

model Course {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug        String    @unique @db.VarChar(100)
  title_en    String    @db.VarChar(255)
  title_vi    String    @db.VarChar(255)
  description String?   @db.Text
  created_by  String?   @db.Uuid
  creator     User?     @relation(fields: [created_by], references: [id], onDelete: SetNull)
  
  lessons     Lesson[]
  grades      CourseGrade[]
  
  @@map("courses")
}

model Lesson {
  id                  String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  course_id           String              @db.Uuid
  title_en            String              @db.VarChar(255)
  title_vi            String              @db.VarChar(255)
  content_markdown_en String              @db.Text
  content_markdown_vi String              @db.Text
  order_index         Int?
  created_by          String?             @db.Uuid
  updated_at          DateTime            @default(now()) @db.Timestamptz
  
  course              Course              @relation(fields: [course_id], references: [id], onDelete: Cascade)
  creator             User?               @relation(fields: [created_by], references: [id], onDelete: SetNull)
  
  templates           QuestionTemplate[]
  sessions            LearningSession[]
  grades              LessonGrade[]

  @@map("lessons")
}

// ---------------------------------------------------------
// 3. QUESTIONS & TESTS
// ---------------------------------------------------------

model QuestionTemplate {
  id                      String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lesson_id               String?            @db.Uuid
  template_type           String             @db.VarChar(50)
  difficulty              String             @default("medium") @db.VarChar(20)
  
  body_template_en        String
  body_template_vi        String
  explanation_template_en String?
  explanation_template_vi String?
  
  logic_config            Json               @default("{}")
  answer_formula          String?
  created_at              DateTime           @default(now()) @db.Timestamptz
  
  lesson                  Lesson?            @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  test_maps               TestTemplateMap[]
  snapshots               QuestionSnapshot[]

  @@map("question_templates")
}

model Test {
  id                 String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title_vi           String            @db.VarChar(255)
  title_en           String            @db.VarChar(255)
  time_limit_seconds Int?
  passing_score      Decimal?          @default(50.0) @db.Decimal(5, 2)
  is_active          Boolean?          @default(true)
  test_maps          TestTemplateMap[]
  attempts           TestAttempt[]

  @@map("tests")
}

model TestTemplateMap {
  test_id     String           @db.Uuid
  template_id String           @db.Uuid
  weight      Int?             @default(1)
  position    Int?
  test        Test             @relation(fields: [test_id], references: [id], onDelete: Cascade)
  template    QuestionTemplate @relation(fields: [template_id], references: [id], onDelete: Cascade)

  @@id([test_id, template_id])
  @@map("test_template_maps")
}

model TestAttempt {
  id           String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String?            @db.Uuid
  test_id      String?            @db.Uuid
  total_score  Decimal?           @db.Decimal(5, 2)
  is_completed Boolean?           @default(false)
  started_at   DateTime           @default(now()) @db.Timestamptz
  completed_at DateTime?          @db.Timestamptz 
  
  user         User?              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  test         Test?              @relation(fields: [test_id], references: [id])
  snapshots    QuestionSnapshot[]
  evidence     ActivityEvidence[]

  @@map("test_attempts")
}

model QuestionSnapshot {
  id                  String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  attempt_id          String?           @db.Uuid
  template_id         String?           @db.Uuid
  generated_variables Json
  student_answer      String?
  is_correct          Boolean?          @default(false)
  points_earned       Int?              @default(0)
  responded_at        DateTime?         @db.Timestamptz
  attempt             TestAttempt?      @relation(fields: [attempt_id], references: [id], onDelete: Cascade)
  template            QuestionTemplate? @relation(fields: [template_id], references: [id])

  @@map("question_snapshots")
}

// ---------------------------------------------------------
// 4. GRADING, TRACKING & AUDIT
// ---------------------------------------------------------

model LearningSession {
  id           String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String             @db.Uuid
  lesson_id    String             @db.Uuid
  started_at   DateTime           @default(now()) @db.Timestamptz
  ended_at     DateTime?          @db.Timestamptz
  duration_sec Int?

  user         User               @relation(fields: [user_id], references: [id], onDelete: Cascade)
  lesson       Lesson             @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  evidence     ActivityEvidence[]

  @@map("learning_sessions")
}

// Tracks user's grade/score for a specific lesson
model LessonGrade {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id        String   @db.Uuid
  lesson_id      String   @db.Uuid
  score          Decimal  @default(0.0) @db.Decimal(5, 2)
  status         String   @default("in_progress") @db.VarChar(20) // "completed", "in_progress"
  graded_at      DateTime @default(now()) @db.Timestamptz

  user           User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  lesson         Lesson   @relation(fields: [lesson_id], references: [id], onDelete: Cascade)

  @@unique([user_id, lesson_id])
  @@map("lesson_grades")
}

// Tracks user's overall grade/status for an entire course
model CourseGrade {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id        String    @db.Uuid
  course_id      String    @db.Uuid
  overall_score  Decimal   @default(0.0) @db.Decimal(5, 2)
  status         String    @default("enrolled") @db.VarChar(20) // "enrolled", "completed"
  completed_at   DateTime? @db.Timestamptz

  user           User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  course         Course    @relation(fields: [course_id], references: [id], onDelete: Cascade)

  @@unique([user_id, course_id])
  @@map("course_grades")
}

model ActivityEvidence {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id     String   @db.Uuid
  attempt_id  String?  @db.Uuid
  session_id  String?  @db.Uuid
  image_url   String
  caption     String?  @db.VarChar(255)
  uploaded_at DateTime @default(now()) @db.Timestamptz

  user    User             @relation(fields: [user_id], references: [id], onDelete: Cascade)
  attempt TestAttempt?     @relation(fields: [attempt_id], references: [id], onDelete: SetNull)
  session LearningSession? @relation(fields: [session_id], references: [id], onDelete: SetNull)

  @@map("activity_evidence")
}

model AuditLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id     String   @db.Uuid
  event_type  String   @db.VarChar(50) 
  metadata    Json?    @default("{}")
  occurred_at DateTime @default(now()) @db.Timestamptz

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("audit_logs")
}

// ---------------------------------------------------------
// 5. CHURCH ORGANIZATION & EVENTS
// ---------------------------------------------------------

model Department {
  id          String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String             @db.VarChar(255)
  description String?            @db.Text
  leader_id   String?            @db.Uuid
  created_at  DateTime           @default(now()) @db.Timestamptz
  leader      User?              @relation("DepartmentLeader", fields: [leader_id], references: [id])
  members     DepartmentMember[]

  @@map("departments")
}

model DepartmentMember {
  department_id String     @db.Uuid
  user_id       String     @db.Uuid
  joined_at     DateTime   @default(now()) @db.Timestamptz
  department    Department @relation(fields: [department_id], references: [id], onDelete: Cascade)
  user          User       @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([department_id, user_id])
  @@map("department_members")
}

model CellGroup {
  id           String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String            @db.VarChar(255)
  location     String?           @db.VarChar(255)
  meeting_time String?           @db.VarChar(100)
  leader_id    String?           @db.Uuid
  leader       User?             @relation("CellGroupLeader", fields: [leader_id], references: [id])
  members      CellGroupMember[]

  @@map("cellgroups")
}

model CellGroupMember {
  cellgroup_id String    @db.Uuid
  user_id      String    @db.Uuid
  joined_at    DateTime  @default(now()) @db.Timestamptz
  cellgroup    CellGroup @relation(fields: [cellgroup_id], references: [id], onDelete: Cascade)
  user         User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([cellgroup_id, user_id])
  @@map("cellgroup_members")
}

model Event {
  id          String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String            @db.VarChar(255)
  description String?           @db.Text
  starts_at   DateTime          @db.Timestamptz
  ends_at     DateTime          @db.Timestamptz
  location    String?           @db.VarChar(255)
  audience    String            @default("public") @db.VarChar(50)
  color       String?           @db.VarChar(50)
  repeat      String            @default("none") @db.VarChar(50)
  
  created_by  String            @db.Uuid
  creator     User              @relation(fields: [created_by], references: [id], onDelete: Cascade)
  attendees   EventAttendance[]

  @@map("events")
}

model EventAttendance {
  event_id      String   @db.Uuid
  user_id       String   @db.Uuid
  check_in_time DateTime @default(now()) @db.Timestamptz
  event         Event    @relation(fields: [event_id], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([event_id, user_id])
  @@map("event_attendance")
}

// ---------------------------------------------------------
// 6. MEDIA & PUBLISHING
// ---------------------------------------------------------

model Article {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug                String    @unique @db.VarChar(255)
  title_en            String    @db.VarChar(255)
  title_vi            String    @db.VarChar(255)
  content_markdown_en String    @db.Text
  content_markdown_vi String    @db.Text
  cover_image_url     String?   @db.Text
  status              String    @default("draft") @db.VarChar(50) // "draft", "published"
  published_at        DateTime? @db.Timestamptz
  created_by          String    @db.Uuid
  creator             User      @relation(fields: [created_by], references: [id], onDelete: Cascade)
  created_at          DateTime  @default(now()) @db.Timestamptz
  updated_at          DateTime  @default(now()) @db.Timestamptz

  @@map("articles")
}

// ---------------------------------------------------------
// 7. NOTIFICATIONS & ALERTS
// ---------------------------------------------------------

model Notification {
  id              String                  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title           String                  @db.VarChar(255)
  message         String                  @db.Text
  type            String                  @default("announcement") @db.VarChar(50) // "announcement", "event_reminder", "system"
  target_type     String                  @default("user") @db.VarChar(50)         // "all", "department", "user"
  target_id       String?                 @db.Uuid                                 // Null if 'all', department_id if 'department', user_id if 'user'
  action_url      String?                 @db.Text                                 // Optional URL to navigate to when clicked
  created_by      String?                 @db.Uuid // Admin who created it. Null if system-generated
  created_at      DateTime                @default(now()) @db.Timestamptz
  
  sender          User?                   @relation("NotificationSender", fields: [created_by], references: [id], onDelete: SetNull)
  recipients      NotificationRecipient[]

  @@map("notifications")
}

model NotificationRecipient {
  notification_id String       @db.Uuid
  user_id         String       @db.Uuid
  is_read         Boolean      @default(false)
  read_at         DateTime?    @db.Timestamptz
  
  notification    Notification @relation(fields: [notification_id], references: [id], onDelete: Cascade)
  user            User         @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([notification_id, user_id])
  @@map("notification_recipients")
}
```
