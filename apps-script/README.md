# Lead capture — Google Sheet + Drive

The form has no backend. Submissions go to a Google Apps Script web app that
appends a row to a Sheet and drops the CV in a Drive folder. The Sheet stores a
**link** to the CV — a spreadsheet cell can't hold a file.

```
form  ──POST JSON──►  Apps Script  ──►  Sheet (row)
                                   └──►  Drive (cv.pdf)
```

## Setup

1. **Create the Sheet.** New Google Sheet, name it e.g. `Beter Horen — Leads`.
   Copy the ID from the URL: `docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`.
   The header row is written automatically on the first submission.

2. **Create the Drive folder** for CVs. Copy its ID from the URL:
   `drive.google.com/drive/folders/`**`<FOLDER_ID>`**.
   Share the folder with the recruiters who need to read CVs — nothing else.

3. **Create the script.** [script.google.com](https://script.google.com) → New
   project → paste `Code.gs` → fill in `SHEET_ID` and `FOLDER_ID`.

4. **Deploy.** Deploy → New deployment → type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Copy the `/exec` URL. "Anyone" means anyone can POST to the endpoint — it does
   not expose the Sheet or the Drive folder, both of which stay private to your
   account. See *Hardening* below.

5. **Wire the page.** Put the `/exec` URL in `ENDPOINT` in each demo and replace
   the placeholder blocks in the submit handler with the code below.

## Client code

Two things matter here:

- **base64, not multipart.** Apps Script web apps can't parse a multipart body
  from a browser reliably. Encode the file and send it inside the JSON.
- **`Content-Type: text/plain`.** This keeps the request a CORS *simple request*,
  so the browser skips the preflight `OPTIONS` — which Apps Script does not
  answer. The body is still JSON; `doPost` parses it as such.

```js
const ENDPOINT = 'https://script.google.com/macros/s/AKfy.../exec';
const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB

/** Reads a File into a bare base64 string (no data: prefix). */
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Collects the tracking params the campaign needs. */
function trackingFields(variant) {
  const q = new URLSearchParams(location.search);
  const get = (k) => q.get(k) || '';
  return {
    gclid: get('gclid'),
    gbraid: get('gbraid'),
    wbraid: get('wbraid'),
    fbclid: get('fbclid'),
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_term: get('utm_term'),
    utm_content: get('utm_content'),
    referrer: document.referrer || '',
    consent: 'granted', // read this from your CMP
    variant,
    timestamp: new Date().toISOString(),
  };
}

async function submitLead(form, fileInput, variant) {
  const payload = {
    naam: form.naam.value.trim(),
    email: form.email.value.trim(),
    tel: form.tel.value.trim(),
    plaats: form.plaats.value.trim(),
    extra: form.extra.value.trim(),
    loondienst: form.loondienst.checked,
    ...trackingFields(variant),
  };

  const file = fileInput.files && fileInput.files[0];
  if (file) {
    if (file.size > MAX_CV_BYTES) throw new Error('CV te groot');
    payload.cv = {
      name: file.name,
      mimeType: file.type,
      base64: await readAsBase64(file),
    };
  }

  // Awaited, not fired alongside the redirect: navigation cancels in-flight
  // requests, so the upload must finish before we leave the page.
  await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}
```

In the submit handler, after validation passes:

```js
submitBtn.disabled = true;
submitBtn.textContent = hasFile ? 'Bezig met uploaden…' : 'Verzenden…';

try {
  await submitLead(form, fileInput, 'demo1');
} catch (err) {
  console.error(err);
  // Decide the failure path: retry, show an inline error, or continue.
  // Silently redirecting on failure loses the lead.
}

window.location.href = 'bedankt.html?v=demo1';
```

## Limits

| | |
|---|---|
| CV size | Cap at ~5 MB client-side. base64 inflates the body by ~33%, and Apps Script rejects very large payloads. |
| Throughput | Apps Script free tier: ~20k executions/day, 6 min per run. Far above what this funnel will see. |
| Latency | A 2 MB CV takes a second or two to encode and upload. That's what the "Bezig met uploaden…" state covers. |

## Hardening

The `/exec` endpoint is public, so it will eventually get junk. Worth adding
before the campaign goes live:

- **A shared secret** in the payload, checked in `doPost` — stops drive-by posts.
- **A honeypot field** hidden with CSS; if it's filled, drop the submission.
- **Server-side validation** of e-mail and phone, so the Sheet stays clean.
- **A MIME allowlist** (`application/pdf`, `.doc`, `.docx`) in `saveCv`.

## GDPR

CVs are personal data. The script deliberately does **not** change file sharing,
so CVs inherit the folder's permissions and stay private — don't switch them to
"anyone with the link". Agree a retention period with the client (commonly four
weeks after the process closes) and set a reminder to purge the folder and the
Sheet rows.

## If you outgrow this

A Netlify Function with a Google service account gives you real error handling,
secrets in env vars, and direct multipart uploads. Same data flow, more moving
parts — worth it once this is a live funnel rather than a demo.
