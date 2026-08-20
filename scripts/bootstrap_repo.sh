#!/usr/bin/env bash
# bootstrap_repo.sh — 足場一式を Git 管理下に置き、GitHub リポジトリを作成する
# 前提: gh CLI が認証済み(gh auth status で確認)
#
# 使い方:
#   ./scripts/bootstrap_repo.sh <repo-name> [--public]
set -euo pipefail

REPO_NAME="${1:?Usage: bootstrap_repo.sh <repo-name> [--public]}"
VISIBILITY="--private"
[ "${2:-}" = "--public" ] && VISIBILITY="--public"

# 1. Git 初期化
if [ ! -d .git ]; then
  git init -b main
fi

# 2. 初回コミット
git add -A
git commit -m "chore: initialize AGENTS.md-centered scaffold" || echo "nothing to commit"

# 3. GitHub リポジトリ作成 + push
gh repo create "$REPO_NAME" $VISIBILITY --source=. --remote=origin --push

# 4. ブランチ保護(main への直接 push を禁止、PR 必須)
#    ※ Free プランの private リポジトリでは branch protection が使えない場合あり。
#    その場合はスキップされるので、AGENTS.md の規約(直接 push 禁止)で運用する。
OWNER=$(gh repo view --json owner --jq .owner.login)
gh api -X PUT "repos/${OWNER}/${REPO_NAME}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  -f 'required_pull_request_reviews[required_approving_review_count]=0' \
  -F 'enforce_admins=false' \
  -F 'required_status_checks=null' \
  -F 'restrictions=null' \
  2>/dev/null && echo "branch protection: enabled" \
  || echo "branch protection: skipped (plan の制約か権限不足。AGENTS.md の規約で運用してください)"

echo ""
echo "✅ done: https://github.com/${OWNER}/${REPO_NAME}"
echo "次の一歩: STATE.md の Current Phase を記入し、feat/REQ-001-xxx ブランチで最初のループを開始"
