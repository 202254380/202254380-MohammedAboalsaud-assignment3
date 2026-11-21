"""Check the real file paths in a project folder or an extracted submission ZIP."""

import argparse
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import tempfile
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.references = []
        self.aria_references = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if attributes.get("id"):
            self.ids.append(attributes["id"])
        for name in ("href", "src"):
            if attributes.get(name):
                self.references.append(attributes[name])
        for name in ("aria-describedby", "aria-labelledby", "aria-controls", "for"):
            if attributes.get(name):
                self.aria_references.extend(attributes[name].split())


def audit(root):
    root = root.resolve()
    errors = []
    checked = 0
    required = ["index.html", "css/styles.css", "js/core.js", "js/script.js", "README.md",
                "docs/ai-usage-report.md", "docs/technical-documentation.md", ".gitignore"]
    for name in required:
        if not (root / name).is_file():
            errors.append(f"Required file missing: {name}")

    def check_reference(source, reference):
        nonlocal checked
        url = urlsplit(reference)
        if url.scheme or url.netloc or not url.path:
            return
        checked += 1
        if reference.startswith("/"):
            errors.append(f"Root-relative path may break on GitHub Pages: {reference}")
            return
        target = (source.parent / unquote(url.path)).resolve()
        if not target.is_relative_to(root) or not target.exists():
            errors.append(f"Broken link in {source.relative_to(root)}: {reference}")

    for source in root.rglob("*"):
        if not source.is_file() or ".git" in source.relative_to(root).parts:
            continue
        if source.suffix == ".html":
            parser = PageParser()
            parser.feed(source.read_text(encoding="utf-8"))
            ids = set(parser.ids)
            for element_id, count in Counter(parser.ids).items():
                if count > 1:
                    errors.append(f"Duplicate id in {source.name}: {element_id}")
            for element_id in parser.aria_references:
                if element_id not in ids:
                    errors.append(f"Missing label/ARIA target in {source.name}: {element_id}")
            for reference in parser.references:
                check_reference(source, reference)
                if reference.startswith("#") and reference[1:] not in ids:
                    errors.append(f"Missing anchor in {source.name}: {reference}")
        elif source.suffix == ".css":
            for reference in re.findall(r"url\([\"']?([^\)\"']+)", source.read_text(encoding="utf-8")):
                check_reference(source, reference)
        elif source.suffix == ".md":
            for reference in re.findall(r"\]\(([^\s)]+)\)", source.read_text(encoding="utf-8")):
                check_reference(source, reference)
    if errors:
        print("FAILED")
        print("\n".join(errors))
        raise SystemExit(1)
    print(f"PASS: {len(required)} required files, {checked} relative links, HTML ids, and label/ARIA targets.")
    print("No root-relative asset paths. References also resolve when the project is hosted below a repository path.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", dest="archive", type=Path, help="Audit the actual submission ZIP.")
    args = parser.parse_args()
    if not args.archive:
        audit(Path(__file__).resolve().parent.parent)
        return
    with tempfile.TemporaryDirectory(prefix="assignment3-check-") as directory:
        destination = Path(directory)
        with ZipFile(args.archive) as archive:
            for info in archive.infolist():
                path = Path(info.filename)
                if path.is_absolute() or ".." in path.parts:
                    raise ValueError("Unsafe archive path")
            archive.extractall(destination)
        roots = [p.parent for p in destination.glob("*/index.html")]
        if (destination / "index.html").is_file():
            roots.append(destination)
        if len(roots) != 1:
            raise SystemExit("The ZIP must contain one clear project root with index.html.")
        audit(roots[0])


if __name__ == "__main__":
    main()
