# Alexa skill: "NestWork" (say "Nest Work")

1. In the Alexa Developer Console, create a Custom skill with your own backend. Paste in `skill.json` and `interaction-model.json`, then set the endpoint to `https://<project>.supabase.co/functions/v1/alexa`.
2. Set up **account linking**, using the Auth Code grant with Supabase Auth as the OAuth provider (a Supabase OAuth server or a small auth bridge). Once linked, Alexa sends a Supabase JWT with each request as `accessToken`.
3. Run `supabase secrets set ALEXA_SKILL_ID=amzn1.ask.skill.…`.
4. Things to say:
   - "Alexa, ask Nest Work what's today."
   - "Alexa, ask Nest Work to add pick up milk tomorrow at five."
   - "Alexa, ask Nest Work for a date idea."
   - "Alexa, ask Nest Work what's today's scripture."
5. **Before publishing:** verify Alexa's request signatures in `functions/alexa` (signature cert chain and timestamp), as the comment in the code notes. Keep the skill private (Alexa for Business, or beta testers) so only your household uses it.
