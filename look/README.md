# Look: FinanceKeem's screen recording platform

Look is FinanceKeem's training and walkthrough video platform, at **https://look.financekeem.com**.
It's a rebranded, self-hosted copy of the open-source [Cap](https://github.com/CapSoftware/Cap) (AGPLv3).

This folder holds what we add on top of Cap:

| Path | What it is |
| --- | --- |
| `brand/` | Look logo files (SVG): full logo, white version, app icon, favicon |
| `rebrand/` | Replacement logo component and color theme that go into Cap's code |
| `scripts/apply-look-branding.py` | Applies all of the above to a Cap checkout in one step |

## Brand

**Logo:** an eye, for "look", with a green record dot as the pupil. The second "o" in the wordmark repeats the dot.

| Role | Color | Hex |
| --- | --- | --- |
| Primary (new) | Look Green | `#30A46C` |
| Primary, darker (hover, text on white) | Deep Green | `#218358` |
| Secondary | FinanceKeem Sage | `#5CA581` |
| Ink / app icon | FinanceKeem Charcoal | `#20242D` |
| Borders, muted | FinanceKeem Platinum | `#C1C4C8` |
| Background | FinanceKeem Soft White | `#F6F7F9` |

Look Green is a brighter, more saturated version of the sage, so the recording UI stands out.
Sage stays in the color scale, right next to it.

## Phase 1 setup (web app, using Cap's desktop recorder)

### Architecture

```
Cap desktop app ──(Settings → Server URL = https://look.financekeem.com)──┐
                                                                          ▼
look.financekeem.com ── Vercel (Next.js web app, from GitHub: <you>/look)
                         ├── MySQL database ............ Railway
                         ├── Media server (FFmpeg) ...... Railway  (apps/media-server)
                         ├── Video storage .............. Cloudflare R2 (S3-compatible)
                         └── Login emails (optional) .... Resend
```

The web app runs on Vercel and GitHub, the same setup as the FinanceKeem site. Vercel can't run a
database or a long-running video processor, so those two go on Railway. Videos are stored in
Cloudflare R2, which doesn't charge for bandwidth when people watch.

### Monthly cost

| Service | Needed? | Cost |
| --- | --- | --- |
| Vercel | Yes | Hobby: $0. Pro: $20/mo (see note) |
| Railway (MySQL + media server) | Yes | About $5–10/mo, usage-based |
| Cloudflare R2 | Yes | Free up to 10 GB, then about $0.015/GB/mo. No bandwidth fees |
| Resend (login emails) | Recommended | Free tier, 3,000 emails/mo |
| AssemblyAI (transcripts, captions) | Optional, decide later | Pay per hour of audio |
| OpenAI / Groq / Anthropic key (AI titles, summaries) | Optional, decide later | Pennies per video |

**Vercel plan note:** Hobby only allows cron jobs once a day, and Vercel's terms limit Hobby to
non-commercial use. On Pro, two cleanup jobs run every 15 minutes and recover any recording that
fails to finish processing. On Hobby, they run once a day. Run the branding script with `--hobby`
if you stay on Hobby.

**Recommended minimum:** Vercel (your current plan) + Railway + R2 + Resend, which comes to about
$5–10/mo on Hobby or $25–30/mo on Pro. Leave AI features off until you decide you want them.

### Steps

1. **Fork** `CapSoftware/Cap` on GitHub into your account and name it `look`.
2. **Apply branding** to the fork, then commit and push:
   ```bash
   python3 -I look/scripts/apply-look-branding.py /path/to/look
   ```
3. **Railway:** create a project, then:
   - Add a **MySQL** database. Copy its connection URL.
   - Add a service from your `look` GitHub repo. Railway picks up `apps/media-server/railway.toml`.
     Set `MEDIA_SERVER_WEBHOOK_SECRET` (random 64-char hex) and generate a public domain for it.
4. **Cloudflare R2:** create a bucket named `look-videos` and an API token with read/write access to
   it. Add a CORS rule that allows `https://look.financekeem.com` (GET, PUT, POST, HEAD).
5. **Vercel:** import the `look` repo with **Root Directory** set to `apps/web`. The install and build
   commands come from `apps/web/vercel.json`. Add the environment variables below.
6. **Database tables:** run the migrations once against the Railway database. On Vercel they don't
   run automatically:
   ```bash
   DATABASE_URL="mysql://..." bun run --cwd packages/database db:push
   ```
7. **Domain:** in Vercel, add `look.financekeem.com` to the project. At your DNS provider, add the
   CNAME record Vercel shows you (usually `look → cname.vercel-dns.com`).
8. **Desktop app:** install Cap from cap.so/download. Go to Settings → Server URL and enter
   `https://look.financekeem.com`, then sign in.

### Vercel environment variables

| Variable | Value |
| --- | --- |
| `WEB_URL` / `NEXTAUTH_URL` | `https://look.financekeem.com` |
| `DATABASE_URL` | Railway MySQL URL |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |
| `DATABASE_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `CAP_AWS_BUCKET` | `look-videos` |
| `CAP_AWS_REGION` | `auto` |
| `CAP_AWS_ACCESS_KEY` / `CAP_AWS_SECRET_KEY` | R2 API token keys |
| `S3_PUBLIC_ENDPOINT` / `S3_INTERNAL_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_PATH_STYLE` | `true` |
| `MEDIA_SERVER_URL` | Railway media server public URL |
| `MEDIA_SERVER_WEBHOOK_SECRET` | Same value as on Railway |
| `MEDIA_SERVER_WEBHOOK_URL` | `https://look.financekeem.com` |
| `CAP_ALLOWED_SIGNUP_DOMAINS` | `financekeem.com` (only your team can create accounts) |
| `RESEND_API_KEY` / `RESEND_FROM_DOMAIN` | Optional: from Resend, after verifying `financekeem.com` |

Without Resend, sign-in links are only written to the Vercel function logs. That's workable while
you're the only user, but set up Resend before inviting anyone.

## License

Look is built on Cap, and most of Cap is AGPLv3. Keep the `look` fork **public** on GitHub. Because
Look is offered over the web, that's how we meet the license's source-sharing requirement.
