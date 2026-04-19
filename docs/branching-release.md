# Branching And Release

## Branch strategy

- `main`: production-ready
- `develop`: integration branch
- `feature/<ticket>-<name>`: feature branch
- `fix/<ticket>-<name>`: bug fix branch
- `hotfix/<ticket>-<name>`: emergency production fix
- `release/x.y.z`: release stabilization branch

## Pull request rule

- PR nho, de review
- Rebase hoac update tu `develop` truoc khi merge
- Merge khi da pass review va basic test
- Khong commit truc tiep vao `main`

## Release flow

1. Cat `release/x.y.z` tu `develop`
2. Chi sua bug, doc, config release tren branch nay
3. Test lai local / staging
4. Merge vao `main`
5. Gan tag `vX.Y.Z`
6. Merge nguoc lai `develop`

## Commit convention

Dung `Conventional Commits`:

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `docs: ...`
- `chore: ...`
- `test: ...`
