# Day 1 database audit

**Date:** 22 October 2026  
**Database audited:** local MySQL `shifthand`  
**Method:** `SHOW TABLES` and `SHOW CREATE TABLE`  
**Result:** Audit completed; corrective migrations are required.

## Current database

The local database contains these application tables:

- `users`
- `organizations`
- `memberships`
- `events`
- `shifts`
- `signups`
- `device_tokens`
- `refresh_tokens`

It also contains Sequelize's `SequelizeMeta` table. The database has the current
migrations through `010-add-phone-to-users.js`.

## Deviations from the 30-day plan and Backend Guide

### Organisations

Current `organizations` has only `id`, `name`, and timestamps.

Required additions:

- `timezone`
- settings/hours rules, preferably as a validated JSON column

### Memberships

Current role enum is:

```text
owner, admin, member
```

Required role enum:

```text
owner, coordinator, shift_lead
```

The migration must preserve existing owner memberships and map existing `admin` and
`member` rows to an explicit compatibility decision before the enum is changed.

### Staff invitations

Missing table `staff_invites`:

- `id`
- `organization_id`
- `email`
- `role`
- `code_hash`
- `expires_at`
- `used_at`
- timestamps

Required indexes include organisation and code hash lookup.

### Events

Current events use `location`, `starts_at`, and `ends_at`.

Required additions or changes:

- `venue` (rename or compatibility migration from `location`)
- `status`
- unique `public_slug`
- lifecycle index by organisation and status

The API must keep UTC storage and apply organisation timezone at the edges.

### Shifts

Current shifts use `title`, `starts_at`, and `ends_at`.

Required additions or changes:

- `role_label`
- `starts_at_utc`
- `ends_at_utc`
- `cancel_cutoff_hours`
- `lead_user_id`
- `notes`
- lifecycle/notification support

The existing `reminder_sent_at` column is a legacy single-flag design and must not be
used for the planned per-signup reminder system.

### Signups

Current signups belong to `user_id` and have no state.

Required additions or changes:

- replace `user_id` ownership with `volunteer_id`
- status enum: `unverified`, `pending`, `confirmed`, `waitlisted`, `offered`,
  `cancelled`, `declined`, `expired`, `completed`, `no_show`
- `hold_expires_at`
- `queue_position`
- `offer_expires_at`
- `cancelled_by`
- `late_cancel`
- unique `(shift_id, volunteer_id)`
- indexes `(shift_id, status)` and `(volunteer_id, status)`

The migration must define how existing signup rows are migrated before removing or
deprecating `user_id`.

### Volunteers

Missing table `volunteers`:

- `id`
- `organization_id`
- `name`
- `email`
- `phone`
- `contact_verified_at`
- `consent_at`
- `blocked`
- timestamps

Required unique key: `(organization_id, email)`.

### Volunteer access tokens

Missing table `volunteer_access_tokens`:

- `id`
- `volunteer_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- `last_used_at`
- timestamps

Only hashes may be stored.

### Attendance

Missing tables:

- `attendance`: one row per signup, check-in/out timestamps, method, staff actor,
  minutes/status/review fields as later phases require
- `attendance_adjustments`: append-only previous/new values, reason, actor, and time

### Messaging and jobs

Missing tables:

- `message_deliveries` as the transactional outbox
- `reminder_jobs`
- `idempotency_keys`
- `audit_log`

The current `shifts.reminder_sent_at` implementation is not sufficient for exactly-once
per-signup reminders or multi-worker claims.

## Corrective migration sequence

The following migrations should be added after the existing `010` migration. Applied
migrations must not be edited.

1. Add organisation timezone and settings JSON.
2. Add staff invite table and indexes.
3. Add volunteer and volunteer-access-token tables.
4. Add event status, public slug, and venue compatibility fields.
5. Add shift role, UTC/timezone, cutoff, lead, notes, and required indexes.
6. Add the complete signup state and volunteer relationship while preserving legacy
   rows during the transition.
7. Add attendance and attendance-adjustment tables.
8. Add outbox/message-delivery and reminder-job tables.
9. Add idempotency-key and audit-log tables.
10. Remove or deprecate legacy reminder state only after the durable reminder flow is
    deployed and verified.

## Day 1 job audit

The previous server startup registered a five-minute in-process reminder cron through
`startJobs()`. It is now disabled in [src/server.js](./src/server.js) so it cannot
send legacy notifications while the durable outbox/job design is being built.

The old job implementation remains available as reference only and must not be
re-enabled as the production scheduler.

## Day 1 items still requiring external input

- Coordinator validation call and pain-point notes
- Pilot date
- Email provider selection
- Sending domain and SPF/DKIM setup
- Apple Developer account status

