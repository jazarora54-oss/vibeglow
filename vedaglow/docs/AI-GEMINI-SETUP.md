# AI Product Creator – free Gemini setup

1. https://aistudio.google.com → **Get API key** (free tier; limits Google badalta rehta hai, wahan dekh lena).
2. Netlify (sirf `dev` scope) → Environment variables:
   - `AI_PROVIDER` = `gemini`
   - `GEMINI_API_KEY` = aapki key (Secret)
   - `AI_MODEL` = abhi khali chhod ke neeche step 4 se model naam lo
   - optional `AI_DAILY_LIMIT` (default 20), `AI_MONTHLY_LIMIT` (default 300)
3. Dev branch pe naya deploy chalao (GitHub me koi chhoti file badal ke commit).
4. Admin → **AI Product Creator** → **Test AI connection**. Agar model galat hai to ye aapki key ke liye available model names dikha dega. Ek naam `AI_MODEL` me daalo, redeploy, phir test.
5. Photo + price daalo. **Create draft with AI (review first)** ya **One click: create product**.

Auto Publish: OFF = sab hidden draft. ON = sirf tab publish jab kuch "needs verification" na ho aur duplicate na ho. AI ingredients/certificates khud nahi banata.
