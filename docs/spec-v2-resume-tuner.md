IMPORTANT FEATURE UPDATE — AUTO EMAIL AFTER RESUME TUNING.

==================================================
NEW FLOW
==================================================

After AI successfully tunes/optimizes the resume:

1. Generate new tailored resume
2. Create downloadable PDF/DOCX
3. Automatically generate professional email
4. Send email with tuned resume attached

==================================================
UPDATED COMPLETE FLOW
==================================================

Upload Resume
→ User discusses target role
→ AI tunes resume for role
→ Generate optimized resume
→ Generate PDF/DOCX
→ Auto-generate professional job application email
→ Attach tuned resume
→ Send email

==================================================
EMAIL FEATURE REQUIREMENTS
==================================================

User can provide:
- recruiter email
- company name
- role name

Example:

"Send tuned resume to hr@company.com for frontend engineer role"

==================================================
EMAIL CONTENT GENERATION
==================================================

AI should generate:
- professional subject
- concise recruiter-friendly body
- role-specific messaging

==================================================
EMAIL TEMPLATE EXAMPLE
==================================================

Subject:
Application for Frontend Engineer Role

Body:
Hello Hiring Team,

Please find attached my updated resume tailored for the Frontend Engineer position.

I believe my experience with React, Next.js, and modern frontend development aligns well with the role requirements.

Looking forward to hearing from you.

Best regards,
Candidate Name

==================================================
IMPORTANT EMAIL RULES
==================================================

AI must:
- keep email professional
- concise
- recruiter-friendly
- avoid overly generic AI wording

==================================================
ATTACHMENT REQUIREMENT
==================================================

Attach:
- newly generated tuned resume PDF
- optionally DOCX

NOT original resume.

==================================================
BACKEND REQUIREMENTS
==================================================

Implement:
- PDF generation
- DOCX generation
- email sending
- attachment support

==================================================
EMAIL TECH STACK
==================================================

Use:
- Nodemailer
- SMTP support
- Gmail/App Password support

==================================================
NEW UI REQUIREMENTS
==================================================

After tuning completes:

Show:
- Resume Preview
- Download PDF button
- Download DOCX button
- Recruiter Email Input
- Send Email button

==================================================
CHAT EXAMPLES
==================================================

- "Tune this for frontend role and send email"
- "Optimize for backend engineer and email recruiter"
- "Tailor this for product engineer role"
- "Generate updated resume and send application"

==================================================
STRICT APPLICATION SCOPE
==================================================

This application ONLY supports:
- resume tuning
- resume optimization
- recruiter-focused resume rewriting
- role-based tailoring
- sending tuned resumes

If unrelated question asked:

Respond ONLY:
"This assistant only supports resume optimization and candidate screening tasks."

==================================================
IMPORTANT AI RULES
==================================================

AI must NOT:
- invent fake experience
- invent fake companies
- exaggerate skills unrealistically

AI should:
- optimize wording
- improve ATS compatibility
- emphasize relevant experience
- preserve truthful information

==================================================
FINAL GOAL
==================================================

Create a local AI-powered resume tailoring assistant that:

- accepts uploaded resumes
- rewrites resumes for target roles
- generates ATS-friendly optimized resumes
- creates downloadable files
- automatically sends professional job application emails with the tuned resume attached