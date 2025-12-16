# Round 5 Issues - Fix Plan

## Issue 1: Chat (household) fail to connect ✅ FIXED
**Problem**: FrontDeskChatButton requires household but fails in admin context
**Fix**: Removed household requirement from button disabled state, allow admin context

## Issue 2: Reservation not being routed to admin (3A to building S1) ✅ FIXED
**Problem**: Admin page not fetching pending reservations correctly
**Fix**: 
- Fixed API response parsing (`result.data` instead of `result.reservations`)
- Added `includePending=true` parameter to fetch pending reservations

## Issue 3: Facility blocks should be clickable
**Problem**: Facility cards not clickable, no detail view
**Fix Needed**:
- Make facility cards clickable
- Create facility detail page with calendar, usage, editing, reservation management
- Add facility CRUD operations

## Issue 4: Language consistency and building button 404
**Problem**: 
- Language not matching selected language
- Building button link broken (404 error)
**Fix Needed**:
- Fix language selector to apply consistently
- Fix building button link

## Issue 5: Admin messaging incorrect
**Problem**: Building admin should see all households with active/inactive status and message other admins
**Fix Needed**:
- Enhance building messages page
- Show all households with active/inactive indicators
- Add admin-to-admin messaging
