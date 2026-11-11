"""Offline publishing checks using disposable Git repos and a fake Hugo CLI.

Run: python3 -m unittest discover -s tests -v
No real Hugo build or external network access is performed.
"""

import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


class PublishingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="vduda-publish-test-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.source = self.base / "source with spaces"
        self.origin = self.base / "origin.git"
        self.seed = self.base / "published"
        self.env = dict(os.environ)
        # Use only fixture configuration, including when the developer signs commits.
        self.env.update(GIT_CONFIG_GLOBAL=os.devnull, GIT_CONFIG_NOSYSTEM="1")
        self.git(self.base, "init", "--bare", "--initial-branch=master", str(self.origin))
        for repo, branch in [(self.source, "master"), (self.seed, "gh-pages")]:
            self.git(self.base, "init", "--initial-branch=" + branch, str(repo))
            self.git(repo, "config", "user.name", "Publishing Test")
            self.git(repo, "config", "user.email", "test@example.invalid")
            self.git(repo, "remote", "add", "origin", str(self.origin))

        (self.source / "scripts").mkdir()
        (self.source / "static").mkdir()
        for name in ["publish_to_ghpages.sh", ".hugo-version", "scripts/check-hugo-version.sh"]:
            shutil.copyfile(ROOT / name, self.source / name)
        (self.source / "static/CNAME").write_text("vlad-duda.com\n")
        (self.source / "static/.nojekyll").touch()
        (self.source / ".gitignore").write_text("/public/\n")
        (self.source / "public").mkdir()
        (self.source / "public/keep.txt").write_text("source output must survive")
        (self.seed / "index.html").write_text("old publication")
        (self.seed / "stale.txt").write_text("obsolete file")
        for repo, branch in [(self.source, "master"), (self.seed, "gh-pages")]:
            self.git(repo, "add", "--all")
            self.git(repo, "commit", "-m", "Initial fixture")
            self.git(repo, "push", "origin", branch)
        self.before = self.remote("rev-parse", "gh-pages")

        commands = self.base / "bin"
        commands.mkdir()
        fake = commands / "hugo"
        fake.write_text('''#!/usr/bin/env bash
set -eu
if [[ "${1:-}" == version ]]; then
    printf 'hugo v%s-test linux/amd64\n' "${HUGO_TEST_VERSION:-0.169.0}"
    exit 0
fi
if [[ "${HUGO_TEST_FAIL:-0}" == 1 ]]; then exit 41; fi
if [[ -n "${HUGO_TEST_RACE_REPO:-}" ]]; then
    printf 'concurrent publication' > "$HUGO_TEST_RACE_REPO/index.html"
    git -C "$HUGO_TEST_RACE_REPO" add index.html
    git -C "$HUGO_TEST_RACE_REPO" commit -m 'Concurrent publication'
    git -C "$HUGO_TEST_RACE_REPO" push origin gh-pages
fi
[[ "$1" == --destination ]]
mkdir -p "$2"
printf 'new publication fixture' > "$2/index.html"
cp static/CNAME static/.nojekyll "$2/"
''')
        fake.chmod(0o755)
        self.env["PATH"] = str(commands) + os.pathsep + self.env["PATH"]
        self.env["TMPDIR"] = str(self.base)

    def git(self, cwd, *args):
        return subprocess.check_output(
            ["git", *args], cwd=cwd, env=self.env, text=True, stderr=subprocess.PIPE
        ).strip()

    def remote(self, *args):
        return self.git(self.base, "--git-dir=" + str(self.origin), *args)

    def publish(self, **extra):
        result = subprocess.run(
            ["bash", "publish_to_ghpages.sh"], cwd=self.source,
            env={**self.env, **extra}, text=True, capture_output=True,
        )
        self.assertEqual(self.git(self.source, "branch", "--show-current"), "master")
        self.assertEqual(self.git(self.source, "status", "--porcelain"), "")
        self.assertEqual(
            (self.source / "public/keep.txt").read_text(), "source output must survive"
        )
        self.assertEqual(len(self.git(self.source, "worktree", "list").splitlines()), 1)
        self.assertEqual(list(self.base.glob("vduda-publish.*")), [])
        return result

    def test_success_preserves_domain_removes_stale_files_and_is_repeatable(self):
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.remote("show", "gh-pages:index.html"), "new publication fixture")
        self.assertEqual(self.remote("show", "gh-pages:CNAME"), "vlad-duda.com")
        files = self.remote("ls-tree", "--name-only", "gh-pages").splitlines()
        self.assertIn(".nojekyll", files)
        self.assertNotIn("stale.txt", files)
        self.assertEqual(self.remote("rev-parse", "gh-pages^"), self.before)
        after = self.remote("rev-parse", "gh-pages")
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.remote("rev-parse", "gh-pages"), after)

    def test_failed_build_leaves_publication_untouched(self):
        result = self.publish(HUGO_TEST_FAIL="1")
        self.assertEqual(result.returncode, 41, result.stdout + result.stderr)
        self.assertEqual(self.remote("rev-parse", "gh-pages"), self.before)

    def test_wrong_hugo_version_leaves_publication_untouched(self):
        result = self.publish(HUGO_TEST_VERSION="0.122.0")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Expected Hugo", result.stderr)
        self.assertEqual(self.remote("rev-parse", "gh-pages"), self.before)

    def test_concurrent_publication_is_not_overwritten(self):
        result = self.publish(HUGO_TEST_RACE_REPO=str(self.seed))
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.remote("show", "gh-pages:index.html"), "concurrent publication")
        self.assertEqual(self.remote("rev-parse", "gh-pages^"), self.before)


if __name__ == "__main__":
    unittest.main()
