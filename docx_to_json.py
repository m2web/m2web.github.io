
import json

sections = {
    "summary": [],
    "skills": [],
    "education": [],
    "experience": []
}

section_headers = {
    "summary of qualifications": "summary",
    "technical skills": "skills",
    "education": "education",
    "employment history": "experience"
}

current_section = None

with open("M2sResumeWord.txt", encoding="utf-8") as f:
    for line in f:
        text = line.strip()
        if not text:
            continue
        lower_text = text.lower()
        if lower_text in section_headers:
            current_section = section_headers[lower_text]
            continue
        if current_section:
            sections[current_section].append(text)

with open("resume.json", "w", encoding="utf-8") as f:
    json.dump(sections, f, indent=2)