#!/usr/bin/env python3
"""
يبني نسخة بملف واحد من موقع "جسر الحرير".

الفائدة: ملف HTML واحد تقدر ترسله بالواتساب أو تفتحه بدون إنترنت
أو ترفعه على أي استضافة بدون مجلدات.

    python3 tools/build_single.py
    -> dist/jisr-alhareer.html
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT  = ROOT / "dist" / "jisr-alhareer.html"

def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")

def main():
    html = read("index.html")

    css = read("assets/css/app.css")
    html = html.replace(
        '<link rel="stylesheet" href="assets/css/app.css">',
        "<style>\n" + css + "\n</style>",
    )

    def inline_script(match):
        src = match.group(1)
        code = read(src)
        # نمنع إغلاق الوسم مبكراً لو ورد نصياً داخل الكود
        code = code.replace("</script>", "<\\/script>")
        return "<script>\n" + code + "\n</script>"

    html = re.sub(r'<script src="(assets/js/[^"]+)"></script>', inline_script, html)

    if "assets/" in html.replace('href="data:', ''):
        leftovers = re.findall(r'(?:src|href)="(assets/[^"]+)"', html)
        if leftovers:
            print("تحذير: ملفات لم تُدمج:", leftovers, file=sys.stderr)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"تم البناء: {OUT.relative_to(ROOT)}  ({len(html)/1024:.1f} كيلوبايت)")

if __name__ == "__main__":
    main()
