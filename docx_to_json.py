import json
import re

# Section mappings
section_headers = {
    "SUMMARY OF QUALIFICATIONS": "summary",
    "TECHNICAL SKILLS": "skills",
    "EDUCATION": "education",
    "EMPLOYMENT HISTORY": "experience"
}

sections = {
    "summary": [],
    "skills": [],
    "education": [],
    "experience": []
}

# Read the entire file
with open("M2sResumeWord.txt", encoding="utf-8") as f:
    content = f.read()

# Create a regex to find any of the headers
# We use | to join headers and handle potential spacing/newlines
pattern = "|".join(re.escape(h) for h in section_headers.keys())
# Split the content by headers, but keep the headers so we know which section started
parts = re.split(f"({pattern})", content)

current_section = None

for part in parts:
    part = part.strip()
    if not part:
        continue
    
    # Check if this part is a header
    upper_part = part.upper()
    if upper_part in section_headers:
        current_section = section_headers[upper_part]
    elif current_section:
        # This is content for the current section
        # We split by common separators or newlines to keep the array-based structure
        # In the original resume, items are often separated by periods or labels
        
        # Try to break down experience into logical chunks (Employer, Title, etc.)
        if current_section == "experience":
            # Ensure key labels are separated by newlines for better parsing
            processed = part
            for label in ["Location:", "Title:", "Duration:", "Employer:"]:
                # Use regex for case-insensitive replacement if needed, but here simple is fine
                processed = processed.replace(label, f"\n{label}")
            
            # Split by "Employer:" to separate jobs
            sub_parts = re.split(r"(Employer:)", processed)
            temp = ""
            for sp in sub_parts:
                if sp == "Employer:":
                    if temp: sections[current_section].append(temp.strip())
                    temp = "Employer: "
                else:
                    temp += sp
            if temp: sections[current_section].append(temp.strip())
        else:
            # For other sections, split by common patterns or newlines
            # Some sections have labels like "AI Orchestration:" embedded
            processed = part
            if current_section == "skills":
                for label in ["Foundry Operations:", "Development:", "Cloud & Governance:"]:
                    processed = processed.replace(label, f"\n{label}")
            
            lines = [line.strip() for line in processed.split('\n') if line.strip()]
            sections[current_section].extend(lines)


# Write output
with open("resume.json", "w", encoding="utf-8") as f:
    json.dump(sections, f, indent=2)

print("Resume parsing complete. Check resume.json for results.")