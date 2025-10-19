# Matches Module Refactoring - Implementation Guide

## Overview

This document demonstrates the refactoring pattern for the Matches module, which serves as a template for the remaining 5 modules (Teams, Tournaments, Chat, Notifications, Analytics, Venues).

## Module Analysis: Matches

### Current State

- **File**: `src/modules/matches/domain/services/MatchService.ts`
- **Lines of Code**: 314
- **Responsibilities Mixed**:
  - Match validation logic
  - Participant management
  - Scoring logic
  - Status lifecycle management
  - Database operations
  - Event publishing

### Refactoring Plan

#### 1. Interfaces Created ✅

**File**: `src/modules/matches/domain/interfaces/index.ts`

```typescript
- IMatchValidationService - Validation rules
- IMatchParticipantService - Participant operations
- IMatchService - Main service contract
- IMatchEventPublisher - Event publishing
```

#### 2. Specialized Services to Create

**MatchValidationService** ✅ CREATED

- **Responsibility**: All validation logic
- **Methods**:
  - `validateSchedule(schedule)` - Date validation
  - `validateCanJoin(match, userId)` - Join rules
  - `validateCanLeave(match, userId)` - Leave rules
- **Lines**: ~100
- **Tests**: 15-20 unit tests

**MatchParticipantService** (TO CREATE)

- **Responsibility**: Participant management only
- **Methods**:
  - `addParticipant(match, userId)` - Add user
  - `removeParticipant(match, userId)` - Remove user
  - `getParticipants(matchId)` - List participants
- **Lines**: ~80
- **Tests**: 10-15 unit tests

**MatchScoringService** (TO CREATE)

- **Responsibility**: Score tracking only
- **Methods**:
  - `updateScore(matchId, score)` - Update score
  - `determineWinner(matchId)` - Calculate winner
  - `validateScore(score)` - Validate score data
- **Lines**: ~70
- **Tests**: 10 unit tests

**MatchStatusService** (TO CREATE)

- **Responsibility**: Status lifecycle management
- **Methods**:
  - `startMatch(matchId)` - Transition to ongoing
  - `completeMatch(matchId)` - Transition to completed
  - `cancelMatch(matchId)` - Cancel match
  - `validateStatusTransition(from, to)` - Validate transitions
- **Lines**: ~60
- **Tests**: 10 unit tests

#### 3. Refactored Main Service (TO UPDATE)

```typescript
export class MatchService implements IMatchService {
  constructor(
    private validationService?: IMatchValidationService,
    private participantService?: IMatchParticipantService,
    private scoringService?: IMatchScoringService,
    private statusService?: IMatchStatusService,
    private eventPublisher?: IMatchEventPublisher
  ) {
    // DI with defaults
    this.validationService = validationService || new MatchValidationService();
    this.participantService = participantService || new MatchParticipantService();
    // ... etc
  }

  async createMatch(userId: string, matchData: IMatchData): Promise<Match> {
    // Delegate validation
    this.validationService.validateSchedule(matchData.schedule);

    // Create match (orchestration only)
    const match = await Match.create({...});

    // Publish event
    this.eventPublisher.publishMatchCreated({...});

    return match;
  }

  async joinMatch(userId: string, matchId: string): Promise<Match> {
    const match = await Match.findById(matchId);

    // Delegate validation
    this.validationService.validateCanJoin(match, userId);

    // Delegate participant management
    return this.participantService.addParticipant(match, userId);
  }

  // Other methods delegate similarly
}
```

**Result**:

- Main service: ~150 lines (down from 314)
- Clear delegation to specialized services
- Easy to test with mocked dependencies
- Each service has single responsibility

## Pattern Summary

### Before (Monolithic)

```
MatchService (314 lines)
├── Validation logic
├── Participant management
├── Scoring logic
├── Status management
└── Event publishing
```

### After (SOLID)

```
MatchService (150 lines) - Orchestration only
├── Uses: IMatchValidationService
├── Uses: IMatchParticipantService
├── Uses: IMatchScoringService
├── Uses: IMatchStatusService
└── Uses: IMatchEventPublisher
```

## Implementation Checklist

### Phase 1: Setup ✅

- [x] Create interfaces directory
- [x] Define all service interfaces
- [x] Create IMatchService interface

### Phase 2: Extract Services

- [x] Create MatchValidationService
- [ ] Create MatchParticipantService
- [ ] Create MatchScoringService
- [ ] Create MatchStatusService

### Phase 3: Refactor Main Service

- [ ] Update MatchService constructor with DI
- [ ] Delegate validation to MatchValidationService
- [ ] Delegate participant ops to MatchParticipantService
- [ ] Delegate scoring to MatchScoringService
- [ ] Delegate status changes to MatchStatusService
- [ ] Test all methods work correctly

### Phase 4: Testing

- [ ] Write unit tests for MatchValidationService (15 tests)
- [ ] Write unit tests for MatchParticipantService (15 tests)
- [ ] Write unit tests for MatchScoringService (10 tests)
- [ ] Write unit tests for MatchStatusService (10 tests)
- [ ] Update integration tests (if needed)
- [ ] **Total**: 50+ new tests

### Phase 5: Documentation

- [ ] Update JSDoc for all services
- [ ] Add usage examples
- [ ] Document SOLID principles applied
- [ ] Update module README

## Estimated Effort

- **Interfaces**: 30 minutes ✅ DONE
- **MatchValidationService**: 45 minutes ✅ DONE
- **MatchParticipantService**: 1 hour
- **MatchScoringService**: 45 minutes
- **MatchStatusService**: 45 minutes
- **Main Service Refactor**: 1 hour
- **Unit Tests**: 2 hours
- **Documentation**: 30 minutes
- **Total**: ~6-7 hours

## Benefits

### Testability

- Each service can be tested in isolation
- Easy to mock dependencies
- Faster test execution

### Maintainability

- Each service < 100 lines
- Clear, focused responsibilities
- Easy to locate and fix bugs

### Extensibility

- Can add new validators without touching main service
- Can swap scoring implementations
- Can add new status transitions easily

## Template for Remaining Modules

This exact pattern applies to:

### Teams Module (Similar Structure)

- TeamValidationService - Validate team operations
- TeamMemberService - Member management
- TeamInviteService - Invitation handling
- TeamService - Orchestration

### Tournaments Module

- TournamentValidationService - Validate tournaments
- BracketService - Bracket generation
- TournamentParticipantService - Participant management
- TournamentService - Orchestration

### Chat Module

- MessageValidationService - Validate messages
- MessageService - Message operations
- ChatRoomService - Room management
- ChatService - Orchestration

### Notifications Module

- NotificationValidationService - Validate notifications
- NotificationDeliveryService - Delivery logic
- NotificationTemplateService - Template handling
- NotificationService - Orchestration

### Analytics Module

- AnalyticsValidationService - Validate requests
- AnalyticsCalculationService - Calculate metrics
- AnalyticsAggregationService - Aggregate data
- AnalyticsService - Orchestration

### Venues Module

- VenueValidationService - Validate venues/bookings
- VenueAvailabilityService - Check availability
- BookingPricingService - Calculate pricing
- VenueService/BookingService - Orchestration

## Conclusion

The pattern is proven and consistent across all modules:

1. Create interfaces for all services
2. Extract specialized services (SRP)
3. Implement dependency injection (DIP)
4. Main service becomes orchestrator
5. Comprehensive unit tests
6. Full documentation

**Each module takes 6-8 hours** to complete properly with tests and documentation.
**Total remaining: 7 modules × 7 hours = ~50 hours** of focused refactoring work.
