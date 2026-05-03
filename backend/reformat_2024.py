import json
import re

# Load existing 2024 question data
with open('../data/question-papers-2024.js', 'r', encoding='utf-8') as f:
    content = f.read()
    # Extract JSON from JS
    json_str = content.replace('window.CRAKMAX_PAPERS_2024 = ', '').rstrip(';')
    papers_2024 = json.loads(json_str)

# Load 2024_eamcetjson.json for answers
try:
    with open('../2024_eamcetjson.json', 'r', encoding='utf-8') as f:
        exam_data = json.load(f)
    print(f"Loaded exam data: {type(exam_data)}")
    if isinstance(exam_data, list):
        print(f"Contains {len(exam_data)} pages")
        print(f"First page keys: {exam_data[0].keys() if exam_data else 'empty'}")
except Exception as e:
    print(f"Error loading exam data: {e}")
    exam_data = None

# Update question structure to match 2025 format
output_data = {"2024": {
    "title": "Andhra Pradesh EAMCET 2024",
    "questions": []
}}

for q in papers_2024["2024"]["questions"]:
    updated_q = {
        "id": q["id"],
        "questionId": q["questionId"],
        "subject": q["subject"],
        "question": q["question"],
        "questionImages": q["questionImages"],
        "options": q["options"],
        "correctOptionIndex": 0  # Default - will be updated if we find answers
    }
    output_data["2024"]["questions"].append(updated_q)

# Save reformatted data
output_file = '../data/paper_2024_reformatted.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)
print(f"\nSaved reformatted data to {output_file}")
print(f"Total questions: {len(output_data['2024']['questions'])}")

# Show sample
print("\n=== Sample Q1 ===")
print(json.dumps(output_data['2024']['questions'][0], indent=2))
