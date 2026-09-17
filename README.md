# Quave engineering review challenge

A fictional merchant payout dashboard with a Rails JSON API, SQLite records, and a React/TypeScript frontend. The payment provider is a local fake. No bank account, API keys, or paid services are required.

Candidates receive one role-appropriate task prompt and a proposed patch by email. Use the exact commit in your invitation, apply only your assigned patch, and review the change using your preferred coding agent.

## Setup

Use Ruby 3.4.6 and Node.js 24.13.0 (see `.ruby-version` and `.nvmrc`). Dependencies and lockfiles are included; Bundler 4.0.19 was used for validation. Install Bundler with `gem install bundler -v 4.0.19` if needed. A working Ruby development toolchain is needed for gems with native extensions.

From the repository root:

```sh
bin/setup
bin/test
```

Setup downloads dependencies and creates local SQLite development and test databases. After setup, the exercise runs locally without external services. Count exercise time after setup succeeds. Contact us if setup fails.

Start both servers with one command from the repository root:

```sh
bin/dev
```

Both servers bind to `0.0.0.0`. Open `http://<server-ip>:5173` from another device, or http://127.0.0.1:5173 locally. Rails runs on port 3000 and Vite forwards `/api` requests to it. Press Ctrl+C to stop both servers. If either server exits, the launcher stops the other too. Run `bin/setup` once before the first launch; `bin/dev` prepares the local development database automatically.

Node is used for frontend tooling; the backend application is Rails.

Seed data includes Cedar and Maple, with overlapping merchant-local payout IDs. Database preparation seeds the development database. To restore the demo, stop Rails and run `bundle exec rails db:reset` inside `backend`, then start Rails again. This resets only the local challenge database.

## Layout and commands

- `backend/app/controllers/api/payouts_controller.rb`: list and dispatch endpoints.
- `backend/app/models/payout.rb`: persistent payout data and API representation.
- `backend/app/services/payout_dispatcher.rb`: dispatch logic.
- `backend/app/services/fake_provider.rb`: simulated external provider.
- `frontend/src/PayoutDashboard.tsx`: merchant/filter selection and payout table.
- `frontend/src/usePayouts.ts`: asynchronous dashboard state.
- `frontend/src/api.ts`: Rails client.

Run Rails tests with `cd backend && bundle exec rails test`. Run frontend tests with `cd frontend && npm test`. `npm run build` also checks TypeScript. Supplied tests demonstrate expected usage; passing them does not prove correctness.

## Business contract

1. A payout ID is unique within one merchant. Distinct merchants may have the same local payout ID. Amounts and destinations are immutable. Amounts are positive integer USD cents.
2. Each logical payout must create at most one accepted provider transfer. Queue redelivery can use the same or a different delivery ID. Deliveries can overlap, including across dispatcher instances.
3. The provider atomically deduplicates requests by idempotency key across the whole provider account. Reusing a key with identical payload returns the original transfer; a different payload raises `IDEMPOTENCY_CONFLICT`. Keys do not expire in this exercise.
4. A provider failure may occur before acceptance or after acceptance with a lost response. A timeout does not prove that payment failed. A subsequent delivery must be able to recover and record the original accepted transfer. Errors must remain visible to the caller.
5. The database and fake provider survive replacement of a dispatcher within the same process. The fake ledger does not survive a complete app-process restart. Production provider persistence is outside this exercise; tests reuse the same provider when replacing a dispatcher.
6. A successful dispatch persists the accepted transfer ID and returns the requested payout with `status: paid`. A failed or unresolved attempt must not fabricate confirmation. A pending record after a timeout means confirmation is unresolved, not necessarily that money did not move.
7. Every list response belongs only to the merchant in the URL, including with a status filter. Unknown merchants return an empty list. Filters narrow the current merchant's records.
8. The dashboard must display data for the currently selected merchant and filter. Older list responses and older submission completions must not overwrite a newer view. Clear outdated rows while loading a different view.
9. During submission, show an in-progress indicator and disable that payout's button. Show `paid` only after server confirmation. On error, show the error, leave the last confirmed status, and allow retry. Successful submissions must respect the active status filter.

## API

- `GET /api/merchants/:merchant_id/payouts`, optionally `?status=pending` or `?status=paid`, returns an array of `{ merchantId, payoutId, amountCents, currency, status, transferId }`.
- `POST /api/merchants/:merchant_id/payouts/:payout_id/dispatch` with JSON `{ "delivery_id": "unique-attempt-id" }` returns the updated payout.
- Provider errors return HTTP 502 with `{ "error": "..." }`. Missing payouts return 404. List filters are limited to those provided by the UI.

Assume upstream authentication authorizes access to the merchant in the URL. You still must retain that merchant's scope in queries. Implementing authentication, webhooks, a real queue, a distributed lock service, production deployment, or new product features is outside scope. Preserve the public API, provider semantics, and existing requirements.

## Provider test controls

`FakeProvider.new(outcomes: [:reject_before_acceptance, :ok])` simulates a rejected request followed by success. `:timeout_after_acceptance` records a transfer and then raises. Remaining requests default to success.

`provider.requests` and `provider.ledger` expose deep copies for assertions. `provider.before_request = ->(request) { ... }` lets tests coordinate threads with queues. These controls are test-only. Service code may only call `create_transfer`. Use a fresh provider and records per test; tests share the local test database and must run serially across processes.

## Submission

Your invitation defines the task, time budget, and deadline. Keep your solution private. We assess review judgment, reproducible failures, focused fixes, effective use of AI, and your ability to explain the work.

Framework references: [Rails API applications](https://guides.rubyonrails.org/api_app.html), [Rails testing](https://guides.rubyonrails.org/testing.html), [React effects](https://react.dev/reference/react/useEffect), [Vite](https://vite.dev/guide/).
