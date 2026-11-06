# Specs

The binding rules of the spec explorer. One file holds one rule.

## Tree

```
specs/
  style/
    backend/   python
    frontend/  angular
    shared/    license
    specs/     content, format, structure
  requirements/
    functional/
      references/  code, paths, specs
      sources/     refs, repositories
      specs/       detail, list
    non-functional/
      accessibility/  language
      compatibility/  deploy
      performance/    loading
      privacy/        personal-data
      security/       access, content, network
      usability/      layout
```

## Index

| ID | Title | Status |
| --- | --- | --- |
| [F/references/code/000019](requirements/functional/references/code/000019_section-references.md) | The detail lists the code references | draft |
| [F/references/code/000020](requirements/functional/references/code/000020_line-link.md) | A code reference links to its line | draft |
| [F/references/code/000021](requirements/functional/references/code/000021_broken-references.md) | Broken references have their own list | draft |
| [F/references/paths/000022](requirements/functional/references/paths/000022_implementation-paths.md) | The detail lists the implementation paths | draft |
| [F/references/paths/000023](requirements/functional/references/paths/000023_not-implemented.md) | A spec without implementation shows it | draft |
| [F/references/paths/000024](requirements/functional/references/paths/000024_tests.md) | The detail lists the tests | draft |
| [F/references/paths/000025](requirements/functional/references/paths/000025_scope-paths.md) | The detail lists the scope paths | draft |
| [F/references/specs/000026](requirements/functional/references/specs/000026_spec-mentions.md) | The detail lists the specs that name each other | draft |
| [F/sources/refs/000004](requirements/functional/sources/refs/000004_ref-kinds.md) | A source is a repository and a ref | draft |
| [F/sources/refs/000005](requirements/functional/sources/refs/000005_commit-sha.md) | A commit SHA has 7 to 40 hex characters | draft |
| [F/sources/refs/000006](requirements/functional/sources/refs/000006_resolved-commit.md) | The page shows the commit of the source | draft |
| [F/sources/refs/000007](requirements/functional/sources/refs/000007_branch-refresh.md) | A branch resolves again after 60 seconds | draft |
| [F/sources/refs/000008](requirements/functional/sources/refs/000008_default-source.md) | The default source is the default branch of STUPA-Workflow | draft |
| [F/sources/refs/000009](requirements/functional/sources/refs/000009_url-holds-view.md) | The URL holds the source and the rule | draft |
| [F/sources/repositories/000001](requirements/functional/sources/repositories/000001_org-allow-list.md) | The explorer reads only repositories of STUPA-MAKERS | draft |
| [F/sources/repositories/000002](requirements/functional/sources/repositories/000002_public-only.md) | The explorer reads only public repositories | draft |
| [F/sources/repositories/000003](requirements/functional/sources/repositories/000003_repository-picker.md) | The repository picker lists the public repositories | draft |
| [F/specs/detail/000015](requirements/functional/specs/detail/000015_front-matter.md) | The detail shows the front matter | draft |
| [F/specs/detail/000016](requirements/functional/specs/detail/000016_body.md) | The detail renders the rule text | draft |
| [F/specs/detail/000017](requirements/functional/specs/detail/000017_file-link.md) | The detail links to the spec file | draft |
| [F/specs/detail/000018](requirements/functional/specs/detail/000018_replaced-by.md) | A replaced spec links to its successor | draft |
| [F/specs/list/000010](requirements/functional/specs/list/000010_every-spec-file.md) | The list shows every spec file | draft |
| [F/specs/list/000011](requirements/functional/specs/list/000011_tree-groups.md) | The list groups by kind, area and topic | draft |
| [F/specs/list/000012](requirements/functional/specs/list/000012_search.md) | The search finds number, rule ID and title | draft |
| [F/specs/list/000013](requirements/functional/specs/list/000013_filters.md) | The list filters by status and kind | draft |
| [F/specs/list/000014](requirements/functional/specs/list/000014_format-error.md) | A file with a format error stays in the list | draft |
| [NF/accessibility/language/000039](requirements/non-functional/accessibility/language/000039_de-en.md) | The UI is German and English | draft |
| [NF/compatibility/deploy/000035](requirements/non-functional/compatibility/deploy/000035_host-name.md) | The explorer runs at specs.workflow.reutlingen.university | draft |
| [NF/compatibility/deploy/000036](requirements/non-functional/compatibility/deploy/000036_one-container.md) | The explorer is one container | draft |
| [NF/performance/loading/000032](requirements/non-functional/performance/loading/000032_tarball-index.md) | One commit is loaded once | draft |
| [NF/performance/loading/000033](requirements/non-functional/performance/loading/000033_cache-limit.md) | The cache holds at most 20 commits | draft |
| [NF/performance/loading/000034](requirements/non-functional/performance/loading/000034_size-limits.md) | Large archives and files are refused | draft |
| [NF/privacy/personal-data/000040](requirements/non-functional/privacy/personal-data/000040_no-third-party.md) | The browser loads nothing from other hosts | draft |
| [NF/security/access/000027](requirements/non-functional/security/access/000027_read-only.md) | The server only reads | draft |
| [NF/security/access/000028](requirements/non-functional/security/access/000028_no-own-login.md) | The explorer has no login | draft |
| [NF/security/content/000031](requirements/non-functional/security/content/000031_no-raw-html.md) | Spec Markdown renders without raw HTML | draft |
| [NF/security/network/000029](requirements/non-functional/security/network/000029_github-hosts.md) | The server calls only GitHub | draft |
| [NF/security/network/000030](requirements/non-functional/security/network/000030_token-server-only.md) | A GitHub token stays on the server | draft |
| [NF/usability/layout/000037](requirements/non-functional/usability/layout/000037_list-detail.md) | The specs page uses list and detail | draft |
| [NF/usability/layout/000038](requirements/non-functional/usability/layout/000038_system-theme.md) | The theme follows the system | draft |
| [S/backend/python/000043](style/backend/python/000043_fastapi.md) | The server is Python with FastAPI | draft |
| [S/frontend/angular/000041](style/frontend/angular/000041_ui-kit-only.md) | Pages are built from ui-kit components | draft |
| [S/frontend/angular/000042](style/frontend/angular/000042_ui-kit-submodule.md) | The ui-kit is a git submodule | draft |
| [S/shared/license/000044](style/shared/license/000044_gpl.md) | The repository is GPL-3.0-or-later | draft |
| [S/specs/content/000059](style/specs/content/000059_only-the-rule.md) | A spec contains only the rule | draft |
| [S/specs/content/000060](style/specs/content/000060_one-thing.md) | One rule controls one thing | draft |
| [S/specs/content/000061](style/specs/content/000061_examinable.md) | A rule can be examined | draft |
| [S/specs/content/000062](style/specs/content/000062_must-and-must-not.md) | The rule text uses must and must not | draft |
| [S/specs/content/000063](style/specs/content/000063_reason.md) | A rule gives its reason | draft |
| [S/specs/content/000064](style/specs/content/000064_test.md) | A rule names its test | draft |
| [S/specs/content/000065](style/specs/content/000065_current-rule.md) | A spec states the current rule | draft |
| [S/specs/content/000066](style/specs/content/000066_ste.md) | A spec is written in ASD-STE100 | draft |
| [S/specs/content/000067](style/specs/content/000067_product-terms.md) | Product terms stay as the UI shows them | draft |
| [S/specs/format/000045](style/specs/format/000045_copy-the-template.md) | A new spec starts as a copy of the template | draft |
| [S/specs/format/000046](style/specs/format/000046_front-matter.md) | A spec starts with a YAML front matter | draft |
| [S/specs/format/000047](style/specs/format/000047_status.md) | The status shows the approval | draft |
| [S/specs/format/000048](style/specs/format/000048_one-rule-per-file.md) | One file holds one rule | draft |
| [S/specs/format/000049](style/specs/format/000049_rule-id.md) | The rule ID has kind, path and number | draft |
| [S/specs/format/000050](style/specs/format/000050_unique-number.md) | The number is the identity of a rule | draft |
| [S/specs/format/000051](style/specs/format/000051_moved-rule.md) | A moved rule keeps its number | draft |
| [S/specs/format/000052](style/specs/format/000052_labels.md) | Labels in a rule are fixed | draft |
| [S/specs/format/000068](style/specs/format/000068_section-sign-reference.md) | Code refers to a rule with the § sign | draft |
| [S/specs/format/000069](style/specs/format/000069_file-name.md) | The file name is number and name | draft |
| [S/specs/structure/000053](style/specs/structure/000053_precedence.md) | A spec wins over other guidance | draft |
| [S/specs/structure/000054](style/specs/structure/000054_tree.md) | The tree sorts by kind, then by area and topic | draft |
| [S/specs/structure/000055](style/specs/structure/000055_folder-names.md) | Folder names are lower case kebab case | draft |
| [S/specs/structure/000056](style/specs/structure/000056_one-place.md) | A rule is written in one place | draft |
| [S/specs/structure/000057](style/specs/structure/000057_index.md) | The index lists every rule | draft |
| [S/specs/structure/000058](style/specs/structure/000058_change-process.md) | A change goes through a pull request | draft |
| [S/specs/structure/000070](style/specs/structure/000070_spec-first.md) | A change request starts as a spec | draft |
