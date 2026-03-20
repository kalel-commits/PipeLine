import sys
import os

files = [
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\pages\LandingPage.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\components\ui\shader-background.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\components\Navbar.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\pages\DashboardPage.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\pages\RegisterPage.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\pages\AnalystDashboard.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\pages\DeveloperDashboard.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\components\AuditLogTable.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\components\FeatureExtraction.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\components\ModelComparison.js",
    r"c:\Users\ajay\Desktop\SE Project\frontend\src\components\SystemStats.js"
]

replacements = {
    "'#6366F1'": "'#E86A33'",
    "'#8B5CF6'": "'#D65A31'",
    "#6366F1": "#E86A33",
    "#8B5CF6": "#D65A31",
    "'#10B981'": "'#4CAF50'",
    "'#FFFFFF'": "'#2D3748'",
    "'rgba(255,255,255,": "'rgba(0,0,0,",
    "rgba(255,255,255,": "rgba(0,0,0,",
    "'#F9FAFB'": "'#2D3748'",
    "'#9CA3AF'": "'#718096'",
    "'#D1D5DB'": "'#4A5568'",
    "'#0D1120'": "'#FCF8E8'",
    "rgba(99,102,241,": "rgba(232,106,51,",
    "rgba(139,92,246,": "rgba(214,90,49,",
    "'#4B5563'": "'#A0AEC0'",
    "#0B0F19": "#FCF8E8",
    "#111827": "#F5F5F5",
    "#151C2E": "#FFFFFF",
    "#1B2438": "#F7FAFC",
}

for path in files:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    for k, v in replacements.items():
        content = content.replace(k, v)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Done")
