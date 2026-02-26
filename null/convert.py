import re
import sys
import urllib.parse
import os

def convert_latex_to_upmath(text):
    # 1. Handle Block Math: $$...$$ and \[...\]
    # We use re.S (DOTALL) to match across multiple lines
    block_pattern = r'(\$\$(.*?)\$\$)|(\\\[(.*?)\\\])'
    
    def block_replace(match):
        formula = (match.group(2) or match.group(4)).strip()
        encoded = urllib.parse.quote(f"\\boxed{"{"} {formula} {"}"}")
        return f"\n\n![{formula}](https://i.upmath.me/png/{encoded})\n\n"

    text = re.sub(block_pattern, block_replace, text, flags=re.S)

    # 2. Handle Inline Math: $...$ and \(...\)
    # We use a non-greedy match that doesn't capture double $$
    inline_pattern = r'(\$([^$]+?)\$)|(\\\((.*?)\\\))'

    def inline_replace(match):
        formula = (match.group(2) or match.group(4)).strip()
        # \inline prefix ensures the SVG is scaled for text lines
        encoded = urllib.parse.quote(f"\\boxed{"{"} {formula} {"}"}")
        return f"![{formula}](https://i.upmath.me/png/{encoded})"

    text = re.sub(inline_pattern, inline_replace, text)

    return text

def main():
    # Check if a filename was provided
    if len(sys.argv) < 2:
        print("Usage: python convert.py <input_file.md> > <output_file.md>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.", file=sys.stderr)
        sys.exit(1)

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        converted_content = convert_latex_to_upmath(content)
        
        # Output to stdout (so > redirection works)
        sys.stdout.write(converted_content)
        
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()