# Ask-anything assistant ("Poochho") — plan

**Phase 1 (now):** answer questions, fetch data, give help. **Phase 2:** take actions on request.
**Brain:** rules first (instant, free), Gemini only when the rules can't answer (owner decision, 25 Nov).

## How it works
1. Owner taps Bolo and speaks. The existing parser decides the intent:
   - a bill, stock or payment command → current flows (unchanged);
   - a question → the assistant.
2. **Question router (on the phone, rules):** matches about 25 question types to fixed data lookups.
3. **Data lookups (server functions, read-only, this shop only):** today/period sales, cash/UPI/udhaar split, top items, slow items, stock left, low stock, who owes most, a customer's balance and history, supplier dues, bill search, last price of an item, busiest hour.
4. **Answer:** a short spoken sentence and a card on screen, in the owner's language, with a "dekho" link to the full screen.
5. **Fallback:** if no rule matches, send the question plus the shop's summary numbers (never raw customer lists) to Gemini through the existing `understand` function. Gemini picks one of the lookups or writes a help answer. Same rate limit: 120 calls per shop per hour.
6. **Help Q&A:** "UPI kaise jodu?", "bill wapas kaise lu?" are answered from a local help list (about 40 entries), with no AI needed.

## Question types (first set)
| Example | Lookup |
|---|---|
| "Aaj kitna bika?" / "kal ka hisaab" | sales(period) |
| "Sabse zyada kya bika is hafte?" | top_items(period) |
| "Cheeni kitni bachi?" (exists today) | stock(item) |
| "Kya khatam hone wala hai?" | low_stock() |
| "Sharma ji ka kitna baaki?" | customer_balance(name) |
| "Sabse zyada udhaar kiska?" | top_debtors() |
| "Gupta supplier ko kitna dena hai?" | supplier_due(name) |
| "Maggi ka rate kya lagaya tha?" | last_price(item) |
| "Galla mein kitna hona chahiye?" | cash_expected(today) |
| "Kal kitne bill bane?" | bill_count(period) |

## Safety
- Read-only in Phase 1; Phase 2 actions always show a confirm card ("Haan / Nahi") before anything changes.
- Every answer is shown with its numbers, so the owner can check them.
- The question log feeds new rules: often-asked questions that went to Gemini become rules.

## Phase 2 (actions, later)
"Sharma ji ko yaad dilao", "Maggi ka rate 15 karo", "kal subah stock check yaad dilana" → each maps to an existing function, behind a confirm card.

## Build order
1. Question intent and router with 10 types, plus answer cards and speech. 2. Server lookups. 3. Help list. 4. Gemini fallback. 5. Question log and admin view.
