import re
from bs4 import BeautifulSoup

JS_PATH = "../js/2001.js"
HTML_PATH = "../thoughts/index.html"  # Adjust if needed

def get_article_list_from_html(html):
    soup = BeautifulSoup(html, 'html.parser')
    articles = []
    for i, a in enumerate(soup.select('.hal-subscr ul li a'), 1):
        title = a.get_text(strip=True)
        href = a.get('href')
        articles.append(f"{i}. {title} ({href})")
    return "\n".join(articles)

def update_js_file(js_path, new_list):
    with open(js_path, encoding="utf-8") as f:
        js = f.read()
    # Regex to match the defaultArticleList assignment (multiline string)
    pattern = r'(const defaultArticleList = `)[\s\S]*?(`;)'
    def repl(match):
        return match.group(1) + new_list + match.group(2)
    new_js = re.sub(pattern, repl, js, flags=re.MULTILINE)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(new_js)

def main():
    with open(HTML_PATH, encoding="utf-8") as f:
        html = f.read()
    new_list = get_article_list_from_html(html)
    update_js_file(JS_PATH, new_list)
    print("defaultArticleList updated in 2001.js")

if __name__ == "__main__":
    main()
