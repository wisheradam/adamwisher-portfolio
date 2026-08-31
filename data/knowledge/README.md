# Ask Adam knowledge base

This directory is the source of truth for public facts used by `/api/ask-adam`.
It deliberately uses versioned TypeScript records rather than an external
database. This keeps the first production version inspectable, inexpensive,
and easy to migrate later.

## Data layout

- `profile.ts`: public professional summary
- `experience.ts`: employment records
- `education.ts`: degrees and long-form programs
- `certifications.ts`: courses, training, and certificate evidence
- `skills.ts`: evidence-backed skill groups
- `achievements.ts`: measurable outcomes
- `projects.ts`: product and transformation initiatives
- `index.ts`: public aggregate exported to retrieval

Every public record includes an ID, category, searchable tags, evidence,
confidence, and a `public` flag. Contact details and private identity aliases
from source material are not stored in the website repository.

## Retrieval flow

1. `lib/knowledge/retrieve.ts` normalizes the question, expands a small set of
   English/Russian synonyms, and ranks fields with transparent weights.
2. At most six relevant records are selected. Context is capped at 7,500
   characters.
3. If the optional server-side LLM environment variables are configured, only
   that context and up to four short prior turns are sent to the provider.
4. If the provider is absent or unavailable, the API returns an extractive
   answer from the same records.

Weak retrieval matches do not reach the LLM. When the available records do not
clearly support an answer, Ask Adam says that verified information is
insufficient and suggests asking Adam directly. It never supplies private
contact details as part of that suggestion.

The prompt explicitly distinguishes AWS Cloud Practitioner preparation courses
from certification. Practical AWS Bedrock work is represented separately.

## Editing rules

Add facts only when a source is available. Use `verified: false` and medium
confidence for owner-provided claims that still need evidence. Never add email,
phone, home address, private identity information, secrets, or access tokens.
Run `npm run build` after changing records or retrieval code.
