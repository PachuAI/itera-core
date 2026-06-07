# Test Patterns

## Good Protective Tests

Route/action sensitive path:

- unauthenticated request returns 401/403;
- unauthorized role returns 403;
- invalid input returns typed error;
- foreign owner ID returns 404/403;
- rejection makes no service/storage/write calls;
- success persists state and maps response correctly.

Service with writes:

- validates parent/foreign IDs before write;
- fails with `NOT_FOUND` for foreign record;
- related writes happen in transaction or are compensated;
- audit/ledger/log is emitted when required;
- provider/storage failure leaves consistent state.

Public token:

- missing/invalid token;
- expired token;
- already-used/idempotent token;
- wrong state;
- happy path changes state exactly once.

Upload/storage:

- rejects size server-side;
- rejects MIME/ext mismatch;
- rejects wrong signature/magic bytes when relevant;
- rejects key/path outside owner scope;
- cleans external object if DB write fails;
- does not reserve/consume quota on validation failure.

E2E smoke:

- logs in through supported path;
- performs one business-critical action;
- asserts visible result;
- reloads or navigates back and asserts persistence;
- uses unique test data prefix and cleanup.

## Anti-Patterns

Do not count these as sufficient protection:

- `expect(true).toBe(true)`;
- `toBeTruthy()` without checking a contract;
- only `result.success === true`;
- render-only tests for business rules;
- mocking the unit under test;
- E2E that only clicks and expects no crash;
- snapshots for authorization, persistence, or data isolation;
- coverage thresholds without invariant mapping.

## Mini-Spec Template

```md
## Contract
- Inputs:
- Outputs:
- Rejections:
- Side effects:

## Risks
- Auth/authorization:
- Ownership/data isolation:
- Persistence/transactions:
- External effects:
- Limits/rate/quota:
- UI wiring:

## Tests
- Unit:
- Integration:
- E2E:
- Manual/operational:

## Validation
- Commands:
- Known gaps:
```
