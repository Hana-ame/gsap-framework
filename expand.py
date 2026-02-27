import re
import time
import requests
import sys
import os

rf"""
文件内部处理逻辑：
1. 正则匹配：使用正则表达式 `\[(https?://[^\]]+)\]` 捕获方括号内的 URL。
2. 异步/顺序请求：遍历匹配到的所有 URL，使用 requests 库发送 GET 请求。
3. 内容插入：将获取到的文本内容进行格式化，紧随在原 URL 的下一行，并添加分割线以示区别。
4. 错误处理：如果 URL 无法访问（404 或网络超时），则在原位置注明错误信息，不中断程序。
5. 编码处理：统一使用 UTF-8 编码读取和写入，防止中文乱码。

处理要点：
- 保持非 URL 部分的原始格式不动。
- 自动识别 URL 边界。
- 为抓取的内容添加简单的 Markdown 代码块包裹，以便于阅读代码文件。

使用方法：
python expand_links.py <输入文件名> <输出文件名>
例如：python expand_links.py input.md output.md

注意事项：
- 请确保已安装 requests 库 (pip install requests)。
- 如果 URL 较多，脚本运行时间取决于网络速度。
- 建议输入文件和输出文件不要同名，以免覆盖原始数据。
"""


def fetch_content(url):
    """
    尝试抓取 URL 内容并返回字符串。
    """
    print(f"正在抓取: {url} ...", end="", flush=True)
    try:
        # 设置超时，防止无限等待
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        # 强制使用 utf-8 解码
        response.encoding = "utf-8"
        print(" [成功]")
        return response.text
    except Exception as e:
        print(f" [失败: {e}]")
        return f"\n> [错误：无法获取内容 - {e}]\n"


def process_file(input_path, output_path):
    """
    读取输入文件，处理所有 [url]，并写入输出文件。
    """
    if not os.path.exists(input_path):
        print(f"错误：找不到输入文件 '{input_path}'")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 正则表达式解释:
    # \[        匹配左中括号
    # (         开始捕获组
    # https?:// 匹配 http:// 或 https://
    # [^\]]+    匹配除了右中括号以外的所有字符（即 URL 本身）
    # )         结束捕获组
    # \]        匹配右中括号
    pattern = r"\[(https?://[^\]]+)\]"

    def replace_callback(match):
        url = match.group(1)
        original_tag = match.group(0)  # [url]
        url = url + "&v=" + time.time()
        fetched_text = fetch_content(url)

        # 组装新内容：保留原标签 + 换行 + 抓取的内容 + 换行
        # 这里使用了 Markdown 的代码块语法，如果内容是代码会非常整洁
        return f"{original_tag}\n\n```\n{fetched_text}\n```\n"

    # 使用 re.sub 的回调函数功能，对每一个匹配项进行网络请求
    new_content = re.sub(pattern, replace_callback, content)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"\n处理完成！结果已保存至: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python expand_links.py <input_file> <output_file>")
    else:
        process_file(sys.argv[1], sys.argv[2])
