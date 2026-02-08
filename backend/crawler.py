import requests
from bs4 import BeautifulSoup


def fetch_html(url: str, timeout: int = 15) -> str:
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    return resp.text


from typing import Optional


def check_page(url: str, selector: Optional[str], text: Optional[str]):
    html = fetch_html(url)

    if selector:
        soup = BeautifulSoup(html, "html.parser")
        match = soup.select_one(selector)
        if match is not None:
            return True, f"selector '{selector}'"
        return False, f"selector '{selector}'"

    if text:
        return (text in html), f"text '{text}'"

    return False, "no selector/text provided"
