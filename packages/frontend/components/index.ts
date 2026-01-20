/**
 * UI Components
 * 
 * Reusable React components for the Compliant platform.
 * 
 * **CURRENT STATUS: This directory is a placeholder for future shared components.**
 * 
 * Most components are currently located in the app directory (`packages/frontend/app`)
 * as Next.js 14 App Router encourages co-location of components with routes.
 * 
 * This directory is reserved for truly shared components that are used
 * across multiple pages and sections of the application.
 * 
 * ## Usage
 * When creating new shared components, add them here and export them from this file.
 * 
 * Examples of components that might live here:
 * - UI primitives (Button, Input, Card, etc.)
 * - Layout components (Header, Footer, Sidebar)
 * - Form components (FormField, FormError, etc.)
 * - Data display (Table, DataGrid, Chart, etc.)
 * 
 * ## Current Implementation Status
 * - Toast notification system for user feedback
 * - FilterBar component for filtering lists
 */

export { ToastProvider, useToast } from './Toast';
export type { ToastType } from './Toast';
export { FilterBar, AdvancedFilter } from './FilterBar';
export type { FilterOption } from './FilterBar';
