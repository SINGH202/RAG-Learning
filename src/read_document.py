from pathlib import Path

file = Path("data/companyPolicies.txt")

content = file.read_text()

print(content)