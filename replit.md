# نظام جدولة الحصص المدرسية

## Overview
This is an Arabic web application designed for managing school timetables. It allows teachers to create their individual schedules, and the system automatically generates class schedules based on teacher inputs. Key capabilities include managing teachers and their subjects, dynamic class section management, sophisticated conflict detection, and a flexible Excel/PDF export system with customizable templates. The project aims to provide an efficient and user-friendly solution for school administration to streamline the scheduling process.

## User Preferences
Not specified.

## System Architecture

### UI/UX Decisions
- **Language and Direction**: Full RTL (Right-to-Left) support.
- **Theming**: Dark theme.
- **Animations**: Smooth animations for a fluid user experience.
- **Typography**: Multiple Arabic fonts are supported.
- **Table Design**: Enhanced table design with clear cell spacing (4px) and soft hover effects without dark borders.
- **Main Page**: The main page directly navigates to the master schedule.
- **Master Schedule Display**: Wide cells (min-w-[60px]) to display full text (e.g., 10/1) without scrolling or truncation.
- **Input Fields**: Input fields for notes column in the master schedule without vertical resize arrows. Cells are empty by default, without placeholder text.

### Technical Implementations
- **Teacher Management**:
    - Teachers are grouped by subject in a single grid, with clear titles for each subject.
    - New teachers appear below the last teacher of the same subject.
    - Smart handling of additional subjects not in the custom list.
    - Custom subject order: Islamic → Arabic → English → Math → Chemistry → Physics → Biology → Social Studies → Computer → Physical Education → Art.
- **Scheduling**: Supports 7 periods x 5 days (Sunday-Thursday).
- **Class Sections**: Dynamic management (add/delete) per class. Automatic validation ensures sections exist before saving, providing clear error messages for missing sections.
- **Conflict Detection**: Prevents scheduling two different teachers in the same time slot and class.
- **Smart Alert System**:
    - Immediate alerts if a class is assigned to another teacher in the same subject (if the original teacher has 2+ periods with that class).
    - Physical education teachers are exempt from this rule.
    - Operates on in-memory `scheduleData` for real-time conflict detection before saving.
- **Individual Slot Deletion**: Ability to delete any slot from a teacher's schedule with immediate UI update.
- **Template Management System**:
    - **Integrated Templates**: 4 fixed Excel templates with visual previews.
    - **Local Storage**: Custom templates are saved locally in `localStorage`.
    - **Custom Template Upload**: Unlimited custom Excel templates can be uploaded.
    - **Template Switching**: Users can select any template for export.
    - **Preview**: Previews for integrated templates.
    - **Deletion**: Custom templates can be deleted (integrated templates are permanent).
    - **Integration**: All export operations automatically use the selected template.
- **Excel/PDF Export**:
    - **Individual Schedules**: Export individual teacher or class schedules.
    - **All Teacher Schedules**: Single Excel file with a page per teacher, merging consecutive slots.
    - **Master Schedule**: Exports all teachers into a single A3-sized, RTL Excel sheet.
        - Column order: Notes ← Days (Thursday to Sunday) ← Number of Periods ← Subject ← Teacher Name ← ID.
        - Day title rows merged with period numbers (7-1).
        - Table is centered on the page with optimized lines and sizes.
    - **All Class Schedules**: Single Excel file with a page per class, merging consecutive slots.
    - **Unified Design**: Wider day column and optimized Arabic fonts.
    - **Customization Dialog**: For selecting fonts and colors.
    - **Consecutive Slot Merging**: Merges cells if the same teacher/subject occupies consecutive slots on the same day.
- **Schedule View**: Option to view schedules with or without teacher names.

### System Design Choices

#### Backend
- **Framework**: Express.js
- **Storage**: In-memory (MemStorage) for stateless operation.
- **API**: RESTful endpoints for CRUD operations.
- **Port**: 5000 (frontend and backend on the same port).
- **Host**: 0.0.0.0

#### Frontend
- **Framework**: React + TypeScript + Vite.
- **Routing**: Wouter.
- **State Management**: TanStack Query (v5).
- **UI Components**: Shadcn/ui + Radix UI.
- **Styling**: Tailwind CSS.
- **PDF Generation**: jsPDF + jsPDF-autotable.
- **Development Server**: Vite integrated with Express.

### Feature Specifications
- **Cache Invalidation**: Manual invalidation of TanStack Query cache is required. Teacher schedule saves/deletes invalidate dependent class schedules.
- **Automatic Updates**: Class schedules are automatically generated from teacher schedules.
- **Cascade Delete**: Deleting a teacher automatically removes all their assigned slots.
- **Conflict Detection**: API prevents saving schedules with conflicts (two slots at the same time and class).
- **Section Validation**: Teacher and master schedule validation ensures sections exist before saving, with detailed error messages.
- **React State Management**: `handleDeleteSlot` creates a new object to ensure immediate re-rendering.
- **Teacher Sorting & Grouping**: Teachers are sorted and grouped by subject. Additional subjects are appended at the end.
- **Smart Alert System**: Alerts work on in-memory data (`scheduleData`) to detect conflicts before saving. PE teachers are exempt from the one-teacher-per-class-per-subject rule.
- **Excel Import System**:
    - Imports master schedule from Excel files.
    - Reads data from specific columns (39 for teacher name, 38 for subject).
    - Normalizes subject names (e.g., removing elongation marks, extra spaces).
    - Supports various spellings/forms of subjects.
    - Reads periods from columns 3-37 (Thursday-Sunday, periods 7-1).
    - Automatically detects conflicts with options to fix or proceed.
    - Saves all teachers, even those without assigned slots.
- **Master Schedule PDF**:
    - RTL layout with columns ordered from right to left (Notes, Days, Periods, Subject, Name, ID).
    - Days and periods are reversed (Thursday to Sunday, 7 to 1).
    - Table is horizontally centered.
    - Day titles are merged with period numbers.
- **Template Management System**: Custom templates are stored locally (localStorage), not on the server. Integrated templates are immutable. The active template is used for all export operations. Switching templates is immediate.

## External Dependencies

- **PDF Generation**: jsPDF, jsPDF-autotable
- **Excel Generation**: Custom implementation utilizing local templates
- **UI Libraries**: Shadcn/ui, Radix UI
- **State Management**: TanStack Query (v5)
- **Routing**: Wouter
- **Styling**: Tailwind CSS