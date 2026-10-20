import os, re
missing = []
for r, d, files in os.walk('.'):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(r, f)
            try:
                content = open(path, encoding='utf-8').read()
            except:
                continue
            if '<CheckCircle2' in content:
                match = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'\"`]lucide-react[\'\"`]', content)
                if match:
                    if 'CheckCircle2' not in match.group(1):
                        missing.append(path)
                else:
                    missing.append(path)
print("MISSING:", missing)
