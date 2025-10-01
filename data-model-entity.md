# Data Model: Sports App Screen Map & UX

## Entities

### User

- id: string (unique)
- profile: Profile
- preferences: object
- stats: object
- friends: array of User ids
- followers: array of User ids
- achievements: array of Achievement ids

### Match

- id: string (unique)
- type: enum (public, private)
- status: enum (upcoming, ongoing, completed, expired)
- participants: array of User ids
- schedule: object (date, time, timezone)
- venue: Venue
- rules: object
- chat: Chat id

### Tournament

- id: string (unique)
- name: string
- matches: array of Match ids
- bracket: object (rounds, structure)
- standings: array of User ids
- rules: object
- chat: Chat id

### Notification

- id: string (unique)
- type: enum (match, tournament, system, chat, alert)
- message: string
- timestamp: datetime
- read: boolean
- action: object

### Chat

- id: string (unique)
- participants: array of User ids
- messages: array of Message ids
- media: array of Media ids
- reactions: object
- threads: array of Thread ids

### Profile

- id: string (unique)
- avatar: string (URL)
- bio: string
- achievements: array of Achievement ids
- qrCode: string (URL)

### Settings

- id: string (unique)
- account: object
- preferences: object
- privacy: object
- security: object
- support: object

### AdminTool

- id: string (unique)
- roster: array of User ids
- scoreInput: object
- bracketEditor: object
- analytics: object
- refunds: object

### Venue

- id: string (unique)
- name: string
- location: object (lat, lng, address)
- surfaceType: string
- capacity: number

### Message

- id: string (unique)
- sender: User id
- content: string
- timestamp: datetime
- media: array of Media ids
- reactions: object
- thread: Thread id

### Media

- id: string (unique)
- url: string
- type: enum (image, video, file)
- uploadedBy: User id
- timestamp: datetime

### Thread

- id: string (unique)
- parentMessage: Message id
- messages: array of Message ids

### Achievement

- id: string (unique)
- name: string
- description: string
- icon: string (URL)

## Relationships

- User can participate in many Matches and Tournaments
- Match has many Users (participants)
- Tournament has many Matches and Users
- Notification belongs to User
- Chat is used in Matches, Tournaments, and direct messages
- Profile belongs to User
- AdminTool is linked to event creators/hosts
- Venue is referenced by Matches
- Messages and Media are linked to Chat and Threads
- Achievements are linked to Users and Profiles

## State Transitions

- Match: upcoming → ongoing → completed/expired
- Tournament: upcoming → ongoing → completed
- Notification: unread → read
- Message: sent → delivered → read

## Validation Rules

- All ids must be unique
- User email/phone must be unique and valid
- Required fields must be present for each entity
- Venue capacity must be positive integer
- Only event creators can access AdminTool

## Scale & Volume

- Support 10k+ concurrent users
- 50+ screens, 25+ reusable components

## Notes

- All data must comply with privacy and security requirements (see constitution)
- All entities must support audit logging for changes
