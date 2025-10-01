# Data Model: Sports Companion Application Frontend

## Core Entities

### User Interface Component

**Purpose**: Reusable UI elements that maintain consistency across platforms and themes

**Attributes**:

- `id`: string (unique component identifier)
- `type`: ComponentType (button | input | card | navigation | modal | typography | icon | progress | toggle)
- `variant`: string (primary | secondary | outline | large | small)
- `theme`: ThemeMode (light | dark | high-contrast)
- `accessibilityProps`: AccessibilityProps
- `platformStyles`: PlatformStyles (ios | android | web specific overrides)
- `state`: ComponentState (default | hover | active | disabled | focus | loading)

**Validation Rules**:

- `id` must be unique within component library
- `type` must be from predefined ComponentType enum
- `accessibilityProps` must include aria-label or aria-labelledby
- `platformStyles` must not conflict with base styles

### Theme System

**Purpose**: Color palettes, typography scales, and spacing tokens that adapt to themes

**Attributes**:

- `id`: string (theme identifier)
- `mode`: ThemeMode (light | dark | high-contrast)
- `colors`: ColorPalette
  - `primary`: string (hex color)
  - `secondary`: string (hex color)
  - `background`: string (hex color)
  - `surface`: string (hex color)
  - `text`: string (hex color)
  - `textSecondary`: string (hex color)
  - `border`: string (hex color)
  - `error`: string (hex color)
  - `success`: string (hex color)
  - `warning`: string (hex color)
- `typography`: TypographyScale
  - `fontFamily`: string
  - `sizes`: FontSizes (12 | 14 | 16 | 18 | 20 | 24 | 32 | 40)
  - `weights`: FontWeights (400 | 500 | 700)
  - `lineHeights`: LineHeights
- `spacing`: SpacingTokens (4 | 8 | 12 | 16 | 24 | 32 | 48 | 64)
- `borderRadius`: BorderRadius (0 | 4 | 8 | 16 | 24)
- `shadows`: ShadowTokens

**Validation Rules**:

- All colors must meet WCAG 2.1 AA contrast ratios (4.5:1 for text, 3:1 for large text)
- Font sizes must support 200% scaling without layout breakage
- Spacing values must use 4px increments for grid alignment

### Navigation Structure

**Purpose**: Menu systems, tabs, and routing that work across mobile and web

**Attributes**:

- `id`: string (navigation identifier)
- `type`: NavigationType (bottom-tabs | top-tabs | drawer | stack | modal)
- `routes`: NavigationRoute[]
  - `name`: string
  - `component`: string (component reference)
  - `icon`: string (icon name)
  - `title`: string
  - `accessibilityLabel`: string
  - `requiresAuth`: boolean
  - `permissions`: string[]
- `platform`: Platform (mobile | tablet | web)
- `accessibility`: NavigationAccessibility
  - `screenReaderSupport`: boolean
  - `keyboardNavigation`: boolean
  - `focusManagement`: boolean

**Validation Rules**:

- Route names must be unique within navigation structure
- All routes must have accessibility labels
- Icons must exist in icon library

### Accessibility Framework

**Purpose**: Screen reader support, keyboard navigation, and contrast management

**Attributes**:

- `id`: string (accessibility feature identifier)
- `type`: AccessibilityType (screen-reader | keyboard-nav | high-contrast | voice-control | motor-assistance)
- `isEnabled`: boolean
- `configuration`: AccessibilityConfig
  - `announceChanges`: boolean
  - `reducedMotion`: boolean
  - `highContrast`: boolean
  - `largeText`: boolean
  - `textScaling`: number (1.0 to 2.0)
- `testingChecklist`: AccessibilityTest[]
  - `criterion`: string (WCAG criterion reference)
  - `description`: string
  - `passed`: boolean
  - `notes`: string

**Validation Rules**:

- Text scaling must not exceed 200% (2.0)
- High contrast mode must maintain 7:1 contrast ratio minimum
- All interactive elements must be keyboard accessible

### Dashboard Widget

**Purpose**: Configurable interface elements showing matches, stats, and social updates

**Attributes**:

- `id`: string (widget identifier)
- `type`: WidgetType (match-overview | stats-chart | social-feed | achievements | calendar | leaderboard)
- `title`: string
- `data`: WidgetData (varies by type)
- `configuration`: WidgetConfig
  - `isVisible`: boolean
  - `position`: GridPosition (row, column)
  - `size`: WidgetSize (small | medium | large)
  - `refreshInterval`: number (seconds)
- `permissions`: string[] (required permissions to view)
- `accessibility`: WidgetAccessibility
  - `description`: string
  - `keyboardInteractive`: boolean
  - `screenReaderFriendly`: boolean

**State Transitions**:

- Loading → Loaded → Error (for data fetching)
- Hidden → Visible (based on user preferences)
- Collapsed → Expanded (for user interaction)

### Privacy Permission System

**Purpose**: Hybrid permission management with contextual requests

**Attributes**:

- `id`: string (permission identifier)
- `type`: PermissionType (camera | location | calendar | contacts | notifications | storage)
- `category`: PermissionCategory (essential | optional)
- `requestTiming`: RequestTiming (onboarding | just-in-time | manual)
- `status`: PermissionStatus (not-requested | granted | denied | restricted)
- `rationale`: string (user-friendly explanation)
- `alternativeFlow`: AlternativeFlow (graceful degradation options)
- `expiryDate`: Date (optional, for temporary permissions)

**Validation Rules**:

- Essential permissions must be requested during onboarding
- Optional permissions must use just-in-time requests
- All permissions must have user-friendly rationale
- Alternative flows must be defined for denied permissions

### Real-time Display Element

**Purpose**: Live updating components for match scores and tournament brackets

**Attributes**:

- `id`: string (element identifier)
- `type`: RealtimeType (score-display | bracket-view | live-chat | participant-list | timer)
- `dataSource`: DataSource (websocket | polling | manual-refresh)
- `updateLatency`: number (target latency in milliseconds)
- `fallbackStrategy`: FallbackStrategy[]
  - `method`: FallbackMethod (polling | manual-refresh | cached-data)
  - `interval`: number (for polling, in seconds)
  - `priority`: number (1-3, higher is better)
- `errorHandling`: ErrorHandling
  - `retryAttempts`: number
  - `backoffStrategy`: BackoffStrategy (linear | exponential)
  - `userNotification`: boolean
- `accessibility`: RealtimeAccessibility
  - `announceUpdates`: boolean
  - `updateFrequencyLimit`: number (max announcements per minute)

**State Transitions**:

- Disconnected → Connecting → Connected → Updating (for real-time connection)
- Live → Fallback → Offline (for connection quality)

### Sport Configuration

**Purpose**: Flexible framework allowing custom sport definitions

**Attributes**:

- `id`: string (sport identifier)
- `name`: string (display name)
- `category`: SportCategory (team | individual | mixed)
- `rules`: SportRules
  - `scoring`: ScoringSystem (points | sets | time | custom)
  - `participants`: ParticipantRules
    - `minPlayers`: number
    - `maxPlayers`: number
    - `teamSize`: number
    - `substitutions`: boolean
  - `matchFormat`: MatchFormat
    - `duration`: MatchDuration (time-based | score-based | sets)
    - `breaks`: BreakRules[]
    - `overtime`: OvertimeRules
- `statistics`: StatisticDefinition[]
  - `name`: string
  - `type`: StatType (counter | timer | percentage | average)
  - `category`: StatCategory (individual | team | match)
- `iconSet`: SportIcons
  - `primary`: string (main sport icon)
  - `actions`: string[] (sport-specific action icons)

**Validation Rules**:

- Sport name must be unique
- Minimum players must be greater than 0
- Maximum players must be greater than or equal to minimum
- All statistics must have valid calculation formulas

## Relationships

### Component-Theme Relationship

- **One-to-Many**: One Theme System provides tokens to many UI Components
- **Constraint**: Components must support all theme modes (light/dark/high-contrast)

### Navigation-Permission Relationship

- **Many-to-Many**: Navigation routes can require multiple permissions, permissions can gate multiple routes
- **Constraint**: Permission checks must occur before route access

### Widget-Permission Relationship

- **Many-to-Many**: Widgets can require multiple permissions, permissions can affect multiple widgets
- **Constraint**: Widgets must gracefully degrade when permissions are denied

### Sport-Widget Relationship

- **One-to-Many**: One Sport Configuration can generate multiple Dashboard Widgets
- **Constraint**: Widget data must conform to sport's statistic definitions

### Realtime-Fallback Relationship

- **One-to-Many**: One Real-time Display Element has multiple Fallback Strategies
- **Constraint**: Fallback strategies must be ordered by priority

## Data Volume Assumptions

- **UI Components**: ~50 reusable components in library
- **Theme Configurations**: 3 base themes (light/dark/high-contrast) + custom variants
- **Navigation Routes**: ~20 main routes, ~50 total including nested routes
- **Dashboard Widgets**: ~10 widget types, ~100 configured instances per user
- **Sport Configurations**: Support for unlimited sports, ~20 predefined popular sports
- **Permission Types**: ~8 system permission types
- **Real-time Elements**: ~15 types across matches, tournaments, and social features

## Performance Considerations

- **Component Rendering**: All components must support React.memo optimization
- **Theme Switching**: Must complete in <200ms without flash
- **Navigation**: Route transitions must complete in <300ms
- **Widget Refresh**: Individual widget updates must not block UI thread
- **Real-time Updates**: <2s latency for critical updates, graceful degradation beyond 5s
