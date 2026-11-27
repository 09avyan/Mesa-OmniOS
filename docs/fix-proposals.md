# Proposed fixes (awaiting owner approval)

## High
1. **Offline mode:** add a service worker that caches the app and the Universe. Bills made offline are queued on the phone and saved when the internet returns; a small "3 bills waiting to save" note shows meanwhile.
2. **Same bill saved twice:** the app sends a unique bill key with every save, and the server ignores a second save with the same key (one new column plus a check in save_bill).
3. **Shop locked by strangers:** count wrong PINs per phone and per shop. A phone that fails 5 times is blocked; the shop itself is only locked after 20 failures from many phones. The owner gets a "someone tried your PIN" note.
4. **PIN strength:** done (6 digits).

## Medium
5. **Screens that hang:** show "Net nahi chal raha — dobara try karo" with a retry button on every screen that loads data.
6. **Undo window:** allow "Wapas lo" only until the next bill or 30 minutes, matching the old promise. Older bills are changed through Bill detail → "Return".
7. **Flavour learning on undo:** reduce the shop's flavour counts when a bill is undone.
8. **Stock below zero:** allow the sale, but show "Stock khatam tha — stock theek karo?" on the saved screen.
9. **Running total while speaking:** use the unit-aware line total, the same as the check screen.

## Low (being done now)
- Lint warnings cleaned up.
- Supabase leaked-password check: owner switch in Supabase → Authentication → Password security (needs your login).
- Admin reports: part of the admin redesign, after you approve the UI.
