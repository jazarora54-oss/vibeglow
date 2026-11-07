# Social Media setup (Facebook Page + Instagram) – VEDAGLOW

Ye sirf OFFICIAL Meta API use karta hai (koi password ya scraping nahi). Paise nahi lagte. Sab kuch pehle `dev` site pe test karo.

## Zaroori cheezein
- Facebook **Page** (personal profile nahi) jiske aap admin ho.
- Instagram **Professional** account (Business/Creator) jo us Page se linked ho.
- Meta developer account: https://developers.facebook.com (free).

## Steps (Hinglish)
1. developers.facebook.com → **My Apps → Create App** → type **Business** → naam `VedaGlow Poster`.
2. App me **Add product** → **Facebook Login for Business** (ya Facebook Login).
3. **Tools → Graph API Explorer**: App select karo → **Get User Access Token** → permissions tick karo:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management` (agar maange).
4. Token generate karke **Get Page Access Token** (Graph Explorer me `me/accounts` call): list me aapka Page, uska `id` (Page ID) aur `access_token` dikhega.
5. **Lamba token (60 din se zyada)**: Graph API Explorer ka token chhota hota hai. Meta ke "Access Token Debugger" me "Extend Access Token" se long-lived banao; Page token jo long-lived user token se nikalte hain wo aam taur par expire nahi hota. Agar token expire ho jaye to admin me "token expired" dikhega: naya token paste karo.
6. Instagram ID: Graph Explorer me `GET /{PAGE_ID}?fields=instagram_business_account` → `id` = Instagram account ID.
7. Website admin → **Social Media** → teen cheezein paste karo (Page ID, Page token, Instagram ID) → **Save & test**. Token sirf server me rehta hai, dobara kabhi dikhaya nahi jaata.
8. Development mode me app sirf un accounts ke liye kaam karti hai jo app me Admin/Developer/Tester hain (aap khud). Dusron ke pages ke liye Meta App Review chahiye; aapko apne hi page ke liye zaroorat nahi.

## Netlify variables (optional)
- `SOCIAL_CRON_SECRET` = koi lamba random text (Secret). Iske bina har-15-minute wala auto job kuch nahi karta.
- `SOCIAL_DAILY_CAP` = roz max posts (default 10).
- Scheduled job sirf **production** deploy pe chalta hai (Netlify rule). `dev` pe "Post due items now" button use karo.

## Safety rules
- **Auto post** default OFF. ON karne par sirf naye publish hue products queue hote hain; cancel kar sakte ho.
- Purane products: "Queue old products" roz kuch hi post karta hai (default 2/day).
- "Posted" tabhi dikhta hai jab Facebook/Instagram ne post id wapas di.
- Instagram sirf JPEG leta hai; system apne aap JPEG banata hai.
- Pinterest / LinkedIn / TikTok abhi nahi bane (har ek ka alag approved developer account chahiye). Stories/Reels API se nahi: Story size download karke Instagram app me upload karo.
