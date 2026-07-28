# Boop — Bot specification

**Archetype:** custom

**Voice:** helpful and conversational — write every user-facing message, button label, error, and empty state in this voice.

A public Telegram AI assistant that answers questions, performs web searches, stores user memories with privacy options, and sends proactive reminders. It supports conversation controls, memory management, and a Safe Mode requiring approval for risky actions.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- general public

## Success criteria

- Bot responds to questions with accurate information including web search sources
- Users can store and manage private/shared memories
- Proactive reminders are delivered on schedule
- Safe Mode approval is required for risky actions

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Show welcome message and quick tips
- **/new** (command, actor: user, command: /new) — Clear current conversation context
- **/model** (command, actor: user, command: /model) — Show current AI model and allow switching
- **/system** (command, actor: user, command: /system) — View/set/reset system prompt
- **/help** (command, actor: user, command: /help) — List commands and features
- **Remember** (button, actor: user, callback: memory:save) — Save a memory with privacy selection
  - inputs: text content, privacy flag (private/shared)
  - outputs: confirmation message
- **Create Reminder** (button, actor: user, callback: reminder:create) — Schedule a proactive notification
  - inputs: content, time, timezone
  - outputs: confirmation message
- **List Memories** (button, actor: user, callback: memory:list) — View stored memories
  - inputs: filter by privacy
  - outputs: memory list

## Flows

### Conversation
_Trigger:_ user message

1. Receive message
2. Process with AI model
3. Generate response
4. Send reply

_Data touched:_ Conversation

### Memory Management
_Trigger:_ memory:save

1. Prompt for content
2. Prompt for privacy flag
3. Save memory
4. Confirm success

_Data touched:_ Memory item

### Reminder Creation
_Trigger:_ reminder:create

1. Prompt for content
2. Prompt for time
3. Prompt for timezone
4. Schedule reminder
5. Confirm success

_Data touched:_ Reminder

### Safe Mode Approval
_Trigger:_ risky action detected

1. Detect risky request
2. Prompt for approval
3. Process if approved
4. Reject if denied

_Data touched:_ Conversation

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — Telegram account information
  - fields: Telegram ID, Locale
- **Conversation** _(retention: persistent)_ — Per-user chat session context
  - fields: History, Current model, System prompt
- **Memory item** _(retention: persistent)_ — User-stored notes, tasks, or preferences with privacy flag
  - fields: Content, Privacy flag, Type, Timestamp
- **Reminder** _(retention: persistent)_ — Scheduled notification tied to a memory or standalone
  - fields: Content, Scheduled time, Timezone, Memory reference
- **Search result** _(retention: session)_ — Web search results with sources and summary
  - fields: Sources, Summary

## Integrations

- **Telegram** (required) — Bot API messaging and proactive notifications
- **Web Search Engine** (required) — Fetch current information for answers
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Notifications

- Proactive reminders via Telegram
- Web search results with source attribution

## Permissions & privacy

- Users can choose private/shared memory visibility
- Memory data is stored securely with privacy flags enforced
- Safe Mode requires explicit approval for risky actions

## Edge cases

- User tries to access another user's private memories
- Reminder scheduling fails due to invalid time format
- Web search returns no relevant results
- User cancels a risky action in Safe Mode

## Required tests

- Verify memory privacy controls work for private/shared flags
- Test proactive reminder delivery at scheduled time
- Validate Safe Mode approval flow for risky actions
- Confirm web search results include 1-3 sources with each answer

## Assumptions

- Default memory privacy is private if not specified
- Timezone defaults to user's Telegram locale
- Web search results will include 1-3 sources per answer
- Risky actions will be properly flagged in Safe Mode
