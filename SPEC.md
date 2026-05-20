# VideoMeet - Professional Video Conferencing Platform

## Project Overview
- **Project Name**: VideoMeet
- **Type**: Web Application (Video Conferencing)
- **Core Functionality**: Real-time video conferencing with recording, screen sharing, and chat capabilities
- **Target Users**: Remote teams, educators, businesses requiring online meetings

---

## UI/UX Specification

### Layout Structure

#### Pages
1. **Landing/Login Page** - Entry point with authentication
2. **Signup Page** - New user registration
3. **Dashboard** - User's meeting management hub
4. **Meeting Room** - Video call interface
5. **Meeting Playback** - Recording playback interface

#### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Visual Design

#### Color Palette
- **Primary**: `#6366F1` (Indigo-500 - main brand color)
- **Primary Dark**: `#4F46E5` (Indigo-600 - hover states)
- **Primary Light**: `#818CF8` (Indigo-400 - accents)
- **Secondary**: `#10B981` (Emerald-500 - success/online)
- **Accent**: `#F59E0B` (Amber-500 - recording/warnings)
- **Danger**: `#EF4444` (Red-500 - mute/end call)
- **Background Dark**: `#0F172A` (Slate-900)
- **Background Medium**: `#1E293B` (Slate-800)
- **Background Light**: `#334155` (Slate-700)
- **Surface**: `#1E293B` (Slate-800)
- **Text Primary**: `#F8FAFC` (Slate-50)
- **Text Secondary**: `#94A3B8` (Slate-400)
- **Text Muted**: `#64748B` (Slate-500)

#### Typography
- **Font Family**: `'Outfit', sans-serif` (headings), `'DM Sans', sans-serif` (body)
- **Headings**:
  - H1: 48px, weight 700
  - H2: 36px, weight 600
  - H3: 24px, weight 600
  - H4: 18px, weight 500
- **Body**: 16px, weight 400
- **Small**: 14px, weight 400
- **Caption**: 12px, weight 400

#### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px

#### Visual Effects
- **Border Radius**: 8px (buttons), 12px (cards), 16px (modals), 24px (large containers)
- **Shadows**:
  - Subtle: `0 2px 4px rgba(0,0,0,0.1)`
  - Medium: `0 8px 24px rgba(0,0,0,0.2)`
  - Strong: `0 16px 48px rgba(0,0,0,0.3)`
- **Glassmorphism**: `backdrop-filter: blur(12px); background: rgba(30,41,59,0.8)`
- **Transitions**: 200ms ease-out (default), 300ms cubic-bezier(0.4,0,0.2,1) (animations)

### Components

#### Buttons
- **Primary**: Filled indigo, white text, hover darken
- **Secondary**: Outlined, indigo border, hover fill
- **Danger**: Red background for end call
- **Icon Button**: Circular, 48px, centered icon

#### Meeting Controls
- Floating bottom toolbar
- Central record button (larger)
- Mute, Camera, Screen Share, Chat, Participants, Reactions
- End Call button (prominent red)

#### Video Grid
- Gallery view: CSS Grid, responsive 1-4 columns
- Speaker highlight: Border glow effect
- Self-view: Picture-in-picture, draggable

#### Chat Panel
- Slide-in from right
- Message bubbles with timestamps
- File attachment support
- Emoji picker

#### Modals
- Centered, glassmorphism background
- Meeting ID/password entry
- Participant management

---

## Functionality Specification

### 1. Authentication System
- Login with email/password
- Signup with name, email, password
- Session storage for user state
- Logout functionality
- Profile view/edit

### 2. Dashboard
- Welcome message with user name
- Quick actions: New Meeting, Join Meeting
- Upcoming meetings list
- Meeting history
- Recorded meetings section
- Settings access

### 3. Meeting Room Features
- **Create Meeting**: Generate unique meeting ID
- **Join Meeting**: Enter meeting ID or link
- **Video Controls**: Toggle camera on/off
- **Audio Controls**: Mute/unmute microphone
- **Screen Sharing**: Share entire screen or window
- **Grid View**: Responsive video grid
- **Participants Panel**: List, manage participants
- **Chat**: Real-time messaging
- **Recording**: Start/stop/pause recording
- **Reactions**: Raise hand, emoji reactions
- **Fullscreen**: Toggle fullscreen mode

### 4. Recording System
- MediaRecorder API for capture
- Blob handling for storage
- Download as WebM file
- Playback page for recordings

### 5. Chat System
- Real-time message delivery
- Message timestamps
- Sender identification
- Message history within session

### 6. Screen Sharing
- Browser MediaDevices API
- Screen/window/tab selection
- Multiple viewer support

---

## Technical Architecture

### Frontend Structure
```
/VideoMeet
├── index.html          (Landing/Login)
├── signup.html         (Registration)
├── dashboard.html     (Main dashboard)
├── meeting.html       (Meeting room)
├── playback.html      (Recording playback)
├── css/
│   ├── main.css       (Global styles)
│   ├── components.css (UI components)
│   └── meeting.css    (Meeting-specific)
├── js/
│   ├── app.js         (Main application)
│   ├── auth.js        (Authentication)
│   ├── dashboard.js   (Dashboard logic)
│   ├── meeting.js     (Meeting room logic)
│   ├── webrtc.js      (WebRTC handling)
│   ├── socket.js      (Socket.IO client)
│   ├── chat.js        (Chat functionality)
│   └── recording.js   (Recording logic)
├── assets/
│   ├── icons/         (SVG icons)
│   └── images/        (Static images)
└── recordings/        (Downloaded recordings)
```

### API Service Architecture
- Base API service with fetch wrapper
- JWT token handling
- Error handling
- Request/response interceptors

### WebRTC Configuration
- STUN servers: Google public servers
- ICE candidate handling
- Media stream management
- Connection state monitoring

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme with indigo accents renders correctly
- [ ] All pages are responsive across breakpoints
- [ ] Animations are smooth (60fps)
- [ ] Glassmorphism effects visible
- [ ] Meeting controls toolbar floats properly

### Functional Checkpoints
- [ ] Login/signup flow works
- [ ] Dashboard displays user info
- [ ] Meeting room UI renders with all controls
- [ ] Video grid displays participants
- [ ] Chat panel opens/closes
- [ ] Recording controls functional
- [ ] Screen share UI available

### Technical Checkpoints
- [ ] No console errors on load
- [ ] WebRTC peer connection initializes
- [ ] Socket.IO connects (mock mode)
- [ ] MediaRecorder API available
- [ ] Responsive breakpoints work

---

## Implementation Notes

### Browser Requirements
- Chrome 80+, Firefox 75+, Safari 14+, Edge 80+
- WebRTC support required
- MediaDevices API required

### Performance Targets
- Initial load: < 3s
- Time to interactive: < 2s
- Memory usage: < 200MB

### Security
- Input sanitization on all forms
- XSS prevention in chat
- Meeting ID validation
- Token-based session handling