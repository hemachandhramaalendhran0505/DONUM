# Map Enhancement TODO List

## Task: Visual Map Analysis - Show nearby Donators, NGOs, and Requesters with Range & Urgency

### Step 1: Update types.ts
- [x] Add `geoLocation` field to NGO interface
- [x] Add `Requester` interface

### Step 2: Update App.tsx
- [x] Add mock NGO data with geoLocation
- [x] Add mock receiver/requester data
- [x] Pass NGOs and requesters to MapView component

### Step 3: Update MapView.tsx
- [x] Accept new props: `ngos` and `requesters`
- [x] Add state for range filter (5km, 10km, etc.)
- [x] Add state for showing/hiding each entity type
- [x] Implement distance calculation function
- [x] Create marker components for:
  - [x] Donors (existing donations) - yellow markers
  - [x] NGOs (verified partners) - green markers
  - [x] Requesters (active requests) - colored by urgency (red/orange/yellow/blue)
- [x] Sort markers by urgency
- [x] Update UI to show legend/controls

### Step 4: Test the implementation
- [x] Verify map displays all entity types
- [x] Verify range filter works
- [x] Verify urgency sorting works

