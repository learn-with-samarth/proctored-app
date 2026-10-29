# Proctored Exam Portal: setup guide (GitHub Pages + Google Forms)

You need 4 things: a Google Form (the exam), a Google Sheet with the backend script (records), a GitHub repo (hosts the page), and the student link.

## 1. Prepare the Google Form
1. Build the exam in Google Forms. Click **Send → link** and copy the link (it looks like `https://docs.google.com/forms/d/e/.../viewform`).
2. **Settings → Responses:** turn OFF "Restrict to users in your organisation" and "Require sign-in" (sign-in screens often fail inside the portal's frame). Ask for the student ID as the first question so answers can be matched to the log.
3. Open the link yourself in a private window to confirm it works without logging in.

## 2. Create the backend (about 5 minutes)
1. Go to **sheets.new**, name it "Exam Records".
2. **Extensions → Apps Script**. Delete the sample code, paste all of `Code.gs`, click Save.
3. **Deploy → New deployment → ⚙ Web app.** Execute as: **Me**. Who has access: **Anyone**. Click Deploy and approve the permissions (Advanced → Go to project → Allow).
4. Copy the **Web app URL** (ends in `/exec`).
5. Any time you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version**, or changes will not go live.

## 3. Add your backend URL to the page
Open `index.html`, find this line near the top of the script, and paste your URL:

```js
LOG_ENDPOINT: '',   →   LOG_ENDPOINT: 'https://script.google.com/macros/s/XXXX/exec',
```

Optional settings in the same block: `MAX_WARNINGS` (default 1), `SNAPSHOT_INTERVAL_MS` (default 60000 = one webcam photo a minute, `0` turns photos off), `REQUIRE_FULLSCREEN`.

## 4. Publish on GitHub Pages
1. On github.com click **New repository** (Public), e.g. `exam-portal`.
2. **Add file → Upload files**, upload `index.html`, commit.
3. **Settings → Pages → Build and deployment:** Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`, Save.
4. After about a minute your page is live at `https://YOUR-USERNAME.github.io/exam-portal/` (GitHub Pages is HTTPS, which the webcam needs).

## 5. Make the student link
Give each class a link with the form preset and locked, so students can't change it:

```
https://YOUR-USERNAME.github.io/exam-portal/?form=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2FYOUR_FORM_ID%2Fviewform
```

Paste your form link into any "URL encode" tool to get the part after `?form=`. If you don't use `?form=`, students paste the link themselves.

## 6. Test before the real exam (do not skip)
1. Open the student link in Chrome on a laptop. Fill the ID, tick the rules, press Start, allow camera and full screen.
2. Switch tabs once: you should get warning 1/1. Switch again: the exam should terminate.
3. Check the **Log** and **State** tabs in your Sheet and the **Exam Snapshots** folder in Drive.
4. Delete your test row from **State** so you can use the same ID again.
5. Run a trial with 2-3 real students on their own laptops and internet.

## During and after the exam
- **A student got terminated by a technical fault:** open the **State** tab, delete their row (or set `terminated` to FALSE), and have them start again.
- **Review:** the **Log** tab shows each violation with time and reason; snapshot links open the photos. Match answers to the student ID.
- **Privacy:** tell students in advance that webcam photos are taken and stored in your Drive, and delete them after results are final.

## What this can and cannot do (be honest with yourself)
It detects tab/window switching, leaving full screen, camera loss, and blocks copy/paste on the portal page. It **cannot** stop: a second device or phone, a person helping off-camera, screen-sharing software, virtual machines, or copy/paste inside the Google Form itself. Use the snapshots for spot checks and consider randomised questions. Anyone who knows your `/exec` URL could send fake log entries, so treat the log as strong evidence, not proof.

Student rules are in `STUDENT-INSTRUCTIONS.md`. Send them to students at least a day before the exam.
