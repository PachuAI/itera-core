# Risk Matrix

Use this as the starting matrix. Rename categories to match the target repo.

| Area | Invariant | Evidence required |
| --- | --- | --- |
| Auth | Anonymous users cannot access protected data/actions | 401/403 tests plus no side effects |
| Session state | Disabled users/accounts/organizations cannot operate | Negative test against route/action/service |
| Authorization | Roles/scopes limit reads and writes | Least-privilege tests, not only hidden UI |
| Data isolation | Tenant/org/user boundary is present on every sensitive query | Cross-boundary test that fails if the filter is removed |
| Ownership | Client-supplied IDs are validated before writes | Foreign ID/NOT_FOUND test with no writes |
| Join/indirect ownership | Mutation by child ID validates parent ownership | Parent-owned negative case |
| Writes | Related writes are atomic or compensated | Transaction/state-final test |
| Audit/observability | Sensitive writes emit audit/log/ledger inside the atomic boundary when required | Test asserts audit/log plus state update |
| Public endpoints | Public reads expose only active/published/non-deleted data | Tests for drafts/removed/expired records |
| Public tokens | Tokens are valid, unexpired, unused/idempotent, and scoped | Expired/used/wrong-state tests |
| Uploads | Server validates size, MIME, extension, and file signature where relevant | Unit plus route tests; never trust client metadata only |
| Storage | Object keys/paths are scoped to the current owner | Cross-owner key rejection |
| Cleanup | External side effects are cleaned up if persistence fails | DB-fail-after-upload test |
| Quotas/rate limits | Limits are atomic, reserved/reverted, or fail closed | Limit exceeded and dependency failure tests |
| Jobs | Jobs handle locks, retries, terminal errors, idempotency, and cleanup | Durable job tests with repeated runs |
| Integrations | External provider failures, invalid responses, and scopes are handled | Mock provider boundary, assert local contract |
| AI/RAG | Context is minimized, access controlled, budgeted, and not instruction-injected | Tests for ACL, budget, source handling, provider failure |
| UI critical flows | User-visible flow wires backend correctly | E2E smoke asserts visible result and persisted/reloaded state |

State labels:

- `protected`: a realistic break fails a test/gate.
- `partial`: useful coverage exists but misses a negative, side effect, or boundary.
- `superficial`: tests exist but mostly assert rendering, truthiness, or happy path.
- `missing`: no direct or credible indirect protection.
