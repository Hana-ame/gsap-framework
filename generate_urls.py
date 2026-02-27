import os
import argparse
import sys
from pathlib import Path


def generate_url(relative_path, username, repo, branch):
    """
    根据文件相对路径生成代理 URL。
    relative_path 应包含 'src/' 前缀（例如 'src/plugins/index.ts'）。
    """
    base_url = f"https://proxy.moonchan.xyz/{username}/{repo}/refs/heads/{branch}/"
    # 将路径中的反斜杠转换为正斜杠，确保 URL 格式正确
    url_path = relative_path.replace("\\", "/")
    return "[" + base_url + url_path + "?proxy_host=raw.githubusercontent.com" + "]"


def main():
    parser = argparse.ArgumentParser(
        description="遍历文件夹，生成所有文件的代理 URL（基于 GitHub raw 代理服务）"
    )
    parser.add_argument(
        "root_dir", default=".", help="项目根目录（必须包含 src 文件夹）"
    )
    parser.add_argument(
        "--username", default="Hana-ame", help="GitHub 用户名，默认 Hana-ame"
    )
    parser.add_argument("--repo", default="Hana-ame", help="仓库名，默认 Hana-ame")
    parser.add_argument("--branch", default="sim", help="分支名，默认 sim")
    args = parser.parse_args()

    root = Path(args.root_dir).resolve()
    if not root.is_dir():
        print(f"错误: 目录不存在 - {root}", file=sys.stderr)
        sys.exit(1)

    # 检查根目录下是否存在 src 文件夹（可选，用于提示）
    src_dir = root / "src"
    if not src_dir.is_dir():
        print(
            f"警告: 根目录下未找到 src 文件夹，但仍会处理所有文件。URL 路径可能不以 src/ 开头。",
            file=sys.stderr,
        )

    urls = []
    # 遍历根目录下所有文件
    for file_path in root.rglob("*"):
        if file_path.is_file():
            # 获取相对于 root 的路径，使用 posix 格式（正斜杠）
            rel_path = file_path.relative_to(root).as_posix()
            # 确保路径以 src/ 开头（根据要求）
            if not rel_path.startswith("src/"):
                # print(f"跳过文件（不在 src 下）: {rel_path}", file=sys.stderr)
                continue
            url = generate_url(rel_path, args.username, args.repo, args.branch)
            urls.append(url)

    if urls:
        print("\n".join(urls))
    else:
        print("未找到符合条件的文件。", file=sys.stderr)


if __name__ == "__main__":
    main()
