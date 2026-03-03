# ralph-protocol — Reference

Source: `.ai/RALPH.md`

## state.json example

```json
{
  "tasks": {
    "audio-waveform": "done",
    "emoji-counting": "in-progress"
  },
  "flags": {
    "awaiting-human-input": false
  }
}
```

## decisions.md entry format

```md
## Decision: <short title>

**Date:** YYYY-MM-DD  
**Context:**  
<Why this decision was needed>

**Decision:**  
<What was chosen>

**Reasoning:**  
<Why this option was selected>

**Alternatives considered:**

- <Alternative 1> — <why rejected>
- <Alternative 2> — <why rejected>

**Tradeoffs / Consequences:**  
<What we gain / lose with this decision>
```

Add an entry for architectural, UX, naming, or workflow decisions. Never delete past entries; append only.

## plan.md ownership format

Each task must include:

```md
- [ ] <Task description>
- Status: in-progress | pending | done | blocked
- Owner: <agent-name> | unassigned
```
