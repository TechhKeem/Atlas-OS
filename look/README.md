# Look: FinanceKeem's screen recording platform

Look is FinanceKeem's training and walkthrough video platform, at **https://look.financekeem.com**.
It's a rebranded, self-hosted copy of the open-source [Cap](https://github.com/CapSoftware/Cap) (AGPLv3).

This folder holds what we add on top of Cap:

| Path | What it is |
| --- | --- |
| `brand/` | Look logo files (SVG): full logo, white version, app icon, favicon |
| `rebrand/` | Replacement logo component and color theme that go into Cap's code |
| `scripts/apply-look-branding.py` | Applies all of the above to a Cap checkout in one step |
| `render.yaml` | Render setup file: website, video processor and database |
| `scripts/rename-cap-text.cjs` | Changes the on-screen word "Cap" to "Look" in a Cap checkout (text only, never code). Run with `node look/scripts/rename-cap-text.cjs <repo> <files…>` |

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

Hosted on **Render**, deployed from **GitHub**, the same tools as the rest of FinanceKeem.
Netlify isn't used here: Look needs servers that run all the time and a database, which Netlify doesn't offer.

### Architecture

```
Cap desktop app ──(Settings → Server URL = https://look.financekeem.com)──┐
                                                                          ▼
look.financekeem.com ── Render: look-web    (website + API, from GitHub <you>/look)
                         ├── Render: look-media  (private, FFmpeg video processing)
                         ├── Render: look-mysql  (private, MySQL 8 + 10 GB disk)
                         ├── Cloudflare R2       (video storage, S3-compatible)
                         └── Resend              (sign-in emails, optional)
```

Everything on Render is defined in `render.yaml` (a Render "Blueprint"), so it's set up in one go.
Videos go to Cloudflare R2 instead of Render's disks, because R2 doesn't charge when people watch.

### Monthly cost

| Service | Plan | Cost |
| --- | --- | --- |
| Render `look-web` | Standard (2 GB RAM) | $25 |
| Render `look-media` | Starter | $7 |
| Render `look-mysql` | Starter + 10 GB disk | $7 + $2.50 |
| Cloudflare R2 | Free up to 10 GB | $0, then about $0.015/GB/mo |
| Resend (sign-in emails) | Free tier | $0 |
| AI transcripts / summaries | Off for now | Pay per use if enabled later |
| **Total** | | **about $42/mo** |

The website needs the 2 GB plan, because Render's 512 MB Starter is too small for it. If long recordings
fail to process, move `look-media` up to Standard as well (+$18).

### Steps

1. **Fork** `CapSoftware/Cap` on GitHub (done: `TechhKeem/Cap`).
2. **Apply branding** to the fork, then commit and push. This also adds `render.yaml`:
   ```bash
   python3 -I look/scripts/apply-look-branding.py /path/to/look
   ```
3. **Cloudflare R2:** create a bucket named `look-videos` and an R2 API token with read/write access
   to it. Add a CORS rule that allows `https://look.financekeem.com` (GET, PUT, POST, HEAD).
4. **Render:** New → Blueprint → choose the `TechhKeem/Cap` repo. Render asks for:
   - `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD`: make up two long passwords.
   - `DATABASE_URL`: `mysql://look:<MYSQL_PASSWORD>@look-mysql:3306/look`
   - `CAP_AWS_ACCESS_KEY`, `CAP_AWS_SECRET_KEY`: from the R2 token.
   - `S3_PUBLIC_ENDPOINT`, `S3_INTERNAL_ENDPOINT`: `https://<account-id>.r2.cloudflarestorage.com`
   - `RESEND_API_KEY`: leave blank for now.

   Render generates the other secrets. The database tables are created on first start.
   If Render shows different internal hostnames for `look-mysql` or `look-media`, update
   `DATABASE_URL` and `MEDIA_SERVER_URL` to match.
5. **Domain:** at your DNS provider for financekeem.com, add the record Render shows under
   look-web → Settings → Custom Domains (a CNAME: `look → look-web.onrender.com`).
6. **Desktop app:** install Cap from cap.so/download. Go to Settings → Server URL and enter
   `https://look.financekeem.com`, then sign in with your financekeem.com email.

Without Resend, sign-in links are only written to the look-web logs in Render. That's workable while
you're the only user, but set up Resend (free) before inviting anyone.

### How Look is built and deployed

GitHub Actions (`.github/workflows/look-images.yml` in `TechhKeem/Cap`) builds `look-web` and
`look-media` on every push to `main` and publishes them to `ghcr.io/techhkeem/`. Render pulls those
images. Render doesn't build them itself, because the web build needs more than Render's 8 GB build limit.
After a new GitHub build, redeploy in Render (look-web → Manual Deploy), or save Render deploy hook
URLs as the repo secrets `RENDER_DEPLOY_HOOK_WEB` / `RENDER_DEPLOY_HOOK_MEDIA` to make it automatic.

### Troubleshooting

- **Recording made but "Unsupported Format" / upload never finishes:** the R2 bucket's CORS policy is
  missing or wrong. It must be *only* the Look rule (allow `https://look.financekeem.com`, methods GET/PUT/POST/HEAD,
  headers `*`, expose `ETag`). Delete any default `localhost` rule. Videos recorded before the fix can't be recovered.
- **Sign-in code accepted but "An error occurred":** you're on `look-web.onrender.com`. Always use `https://look.financekeem.com`.
- **502 page plus `Access denied for user 'look'` in the look-web logs:** the password in `DATABASE_URL`
  doesn't match the database. MySQL keeps the password from its very first start, so changing
  `MYSQL_PASSWORD` later has no effect. Fix it from look-mysql → Shell:
  `mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "ALTER USER 'look'@'%' IDENTIFIED BY '$MYSQL_PASSWORD'; FLUSH PRIVILEGES;"`

## License

Look is built on Cap, and most of Cap is AGPLv3. Keep the `look` fork **public** on GitHub. Because
Look is offered over the web, that's how we meet the license's source-sharing requirement.
