"""Verify additive website migration keeps existing property records intact."""
import os,sqlite3,subprocess,sys
from pathlib import Path

def test_website_upgrade_roundtrip_preserves_existing_data(tmp_path):
 root=Path(__file__).resolve().parents[1]
 database=tmp_path/'migration.db'
 env={**os.environ,'DATABASE_URL':'sqlite:///'+str(database)}
 def migrate(target,command='upgrade'):
  subprocess.run([sys.executable,'-m','alembic',command,target],cwd=root,env=env,check=True,capture_output=True,text=True)
 migrate('0003')
 with sqlite3.connect(database) as c:
  c.execute("INSERT INTO tenants (id,name,slug,created_at) VALUES ('tenant-before','Before website migration','before','2026-10-19 00:00:00')")
 for target,command in [('head','upgrade'),('0003','downgrade'),('head','upgrade')]:
  migrate(target,command)
  with sqlite3.connect(database) as c:
   assert c.execute("SELECT name FROM tenants WHERE id='tenant-before'").fetchone()[0]=='Before website migration'
