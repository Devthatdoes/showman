# Strategic Direction: Premium Mobile & API Architecture

## 1. The Vision: From Tool to Experience
The goal of Showman is to provide a "Raw" and "Direct" alternative to traditional artist booking. To achieve this, the user experience must feel organic, fluid, and high-end. The current Next.js implementation provides a strong foundation, but to scale to a premium mobile presence, we must shift our architectural approach.

## 2. Technical Pivot: API-First Architecture
To support a native mobile ecosystem without duplicating business logic or risking data desynchronization, we must decouple the Frontend from the Backend.

### Current State:
- Monolithic Next.js app (UI and DB logic tightly coupled).
- Server-side rendering for most views.

### Proposed State:
- **Headless Backend**: Transform the existing Next.js `/api` routes into a robust, documented REST or GraphQL API.
- **Unified Auth**: Implement a stateless authentication system (e.g., JWT) that allows the Web Client, iOS App, and Android App to authenticate against the same identity provider.
- **Client Decoupling**: The Web Frontend becomes a "consumer" of the API, just like the future mobile apps.

## 3. Mobile Strategy: Native Swift (iOS)
To maintain the "Organic" and "Alive" feel of the brand, we will bypass hybrid wrappers (Capacitor/React Native) in favor of **Native Swift/SwiftUI** for the initial mobile launch.

### Why Native Swift?
- **Fluidity**: Access to Core Animation and SwiftUI's spring physics allows for the "non-linear" and "organic" transitions that define the Showman brand.
- **Performance**: Zero-latency interaction for managers coordinating multiple artists in real-time.
- **Hardware Integration**: Better integration with iOS calendars and notifications for booking alerts.

### Implementation Roadmap:
1. **API Hardening**: Finalize the `/api` endpoints for Artist Discovery, Booking Requests, and Team Management.
2. **Design System Mapping**: Translate the "Raw Gallery" web design (deep obsidian palette, fluid backgrounds, reveal animations) into a native iOS Design System.
3. **Core Feature Set**:
    - **Discovery Feed**: A high-performance `LazyVGrid` for browsing artists.
    - **Booking Concierge**: A native, multi-step request flow.
    - **Team Dashboard**: Integrated calendar views for managers to coordinate multiple artists.

## 4. The "Living Gallery" Standard
The engineer is encouraged to move away from "template-style" layouts. The UI should feel like a curated gallery—utilizing asymmetry, varying image scales, and subtle, cursor/touch-responsive background elements—to ensure the platform feels "alive" rather than corporate.
