# Grammar Helper

A small browser app that rewrites and polishes messages using Groq.

## What it does

- Rewrites rough drafts with better grammar and clarity
- Supports channels: Work email, Personal email, Teams, and WhatsApp
- Has two modes: Rewrite and Reply
- Saves your settings and API key in browser localStorage


## Files

- index.html: page shell and styles
- tweaks-panel.jsx: tweak panel and controls
- components/data.jsx: channels, tones, models, prompt builders, Groq API call
- components/app.jsx: main app UI and behavior

## Notes

- No build step required
- Uses React and Babel from CDN
- Add your Groq API key in Settings to use rewriting
