"""Export a read-only web catalog outside the site's public directory."""
import json, sqlite3, sys
from pathlib import Path
db = sqlite3.connect(Path(sys.argv[1]).resolve().as_uri() + "?mode=ro", uri=True)
db.row_factory = sqlite3.Row
try:
    rows = [dict(r) for r in db.execute("select id,sku,model,family,description,price_raw,currency,page from records order by page,id")]
    notes = {}
    for page, note in db.execute("select page,text from internal_notes order by page,rowid"):
        notes.setdefault(page, []).append(note)
    issues = {}
    for rid, title in db.execute("select distinct l.record_id,i.title from issue_links l join issues i on i.id=l.issue_id"):
        issues.setdefault(rid, []).append(title)
    for r in rows:
        r["notes"] = notes.get(r["page"], [])
        r["issues"] = issues.get(r["id"], [])
    Path(sys.argv[2]).write_text(json.dumps(rows,ensure_ascii=False),encoding="utf-8")
finally:
    db.close()
