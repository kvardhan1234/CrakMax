import json
import re

# Load exam data
with open('../2024_eamcetjson.json', 'r', encoding='utf-8') as f:
    exam_data = json.load(f)

# Combine all pages into one text
full_text = "\n".join([page.get('content', '') for page in exam_data])

# Extract answers - look for patterns like "Answer: 1" or "Correct Option: 2"
answers = {}

# Try different patterns to find answers
patterns = [
    r'Question\s+(?:Number\s+)?:\s*(\d+)[^\d]*?Answer[:\s]+([1-4])',
    r'Q\.?\s*(\d+)[^\d]*?Ans[:\s]+([1-4])',
    r'Question\s*(\d+).*?Option\s*:\s*([1-4])',
    r'(\d+)\)\s+Answer[:\s]+([1-4])',
]

for pattern in patterns:
    matches = re.finditer(pattern, full_text, re.IGNORECASE | re.DOTALL)
    for match in matches:
        q_num = int(match.group(1))
        answer = int(match.group(2)) - 1  # Convert to 0-indexed
        if q_num not in answers:
            answers[q_num] = answer

print(f"Found {len(answers)} answers from patterns:")
if answers:
    for q_num in sorted(list(answers.keys())[:10]):
        print(f"  Q{q_num}: Option {answers[q_num] + 1}")
else:
    print("  No answers found with patterns")

# Check for any text containing "green" or "correct" markers
print("\n=== Checking for answer indicators ===")
if 'green' in full_text.lower():
    print("Found 'green' in text (marked answers)")
if 'correct' in full_text.lower():
    print("Found 'correct' in text")

# Look for Option headers with question markers
print("\n=== Sample content with Options ===")
q1_match = re.search(r'Question\s+Number\s*:\s*1.*?Question\s+Number\s*:\s*2', full_text, re.DOTALL)
if q1_match:
    sample = q1_match.group(0)[:300]
    print(sample)

# Save answers found
with open('answers_found.json', 'w') as f:
    json.dump(answers, f, indent=2)
print(f"\nSaved {len(answers)} answers to answers_found.json")

