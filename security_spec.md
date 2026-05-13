# Security Specification for SaccoSwift

## Data Invariants
1. A transaction must always have a valid userId matching the auth user.
2. A user can only read their own profile, unless they are an admin.
3. Loans can only be approved by admins.
4. Users cannot modify their own balance fields directly; these are updated via backend logic (or strictly controlled if client-side logic is allowed for demo, but we should use a "Action-Based" update pattern).
5. All IDs must match standard ID format.

## The Dirty Dozen Payloads (Attack Vectors)
1. **Balance Injection**: User tries to update their own `savingsBalance` to $1,000,000.
2. **Identity Spoofing**: User A tries to create a transaction with `userId` of User B.
3. **Self-Approval**: User tries to update their loan status from `pending` to `approved`.
4. **Admin Escalation**: User tries to set `isAdmin: true` in their own profile.
5. **Orphaned Transaction**: User creates a transaction referencing a non-existent `relatedMemberId`.
6. **Negative Transfer**: User tries to transfer a negative amount to drain another user's balance? (Actually, `amount > 0` should be enforced).
7. **Shadow Field**: User adds `verified: true` to a loan application to bypass admin checks.
8. **PII Leak**: User A tries to 'get' User B's profile to see their `identityId` and `kraPin`.
9. **Timestamp Counterfeit**: User sets `createdAt` to a date in the past for a new loan.
10. **ID Poisoning**: User uses a 2KB string as a document ID to bloat the database.
11. **Guarantor Hijack**: User adds themselves as their own guarantor.
12. **Status Shortcutting**: User moves a loan from `rejected` back to `pending`.

## Security Rule Logic
- `isValidUser(data)`: Enforces strict keys, types, and size.
- `isValidTransaction(data)`: Enforces `amount > 0`, `userId == request.auth.uid`.
- `isValidLoan(data)`: Enforces `status == 'pending'` on create.
- `isAdmin()`: Checks `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
