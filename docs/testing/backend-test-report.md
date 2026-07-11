# Backend Test Report

## Scope

This report covers the Express/MongoDB backend test suite for:

- Health endpoint
- Registration, login, JWT-protected `/me`, password hashing, and password hiding
- Admin authorization checks
- Public vs admin operator visibility
- Activity creation, update, slug recalculation, price recalculation, and archive-on-delete behavior
- Booking creation, ownership restrictions, and admin status updates
- Review rules for completed bookings, operator/activity relationship, duplicate prevention, and metric recalculation
- Admin user self-protection and safe user deletion
- Support messages, newsletter subscriptions, dashboard revenue, and upload validation

## Tools

- Vitest
- Supertest
- mongodb-memory-server
- Mongoose
- V8 coverage provider

## Commands

```bash
npm test
npm run test:coverage
```

## Latest Result

- API test files: 4 passed
- API tests: 17 passed
- Statement coverage: 65.09%
- Branch coverage: 41.86%
- Function coverage: 62.77%
- Line coverage: 65.02%

Coverage artifacts are generated in `coverage/`.

## Test Data Safety

- API tests run against an in-memory MongoDB instance.
- The local development MongoDB database is not used by backend unit/API tests.
- Upload validation tests use a test-only upload directory and remove it after the run.

## Notes

- Morgan request logging is disabled only when `NODE_ENV === 'test'` to keep test output readable.
- Remaining uncovered areas are mostly less-used controller branches, notification/wishlist endpoints, and defensive error paths.
