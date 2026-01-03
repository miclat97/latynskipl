import os
from playwright.sync_api import sync_playwright

def verify_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        cwd = os.getcwd()
        if cwd.endswith("verification"):
            html_path = os.path.join(cwd, "../index.html")
        elif cwd.endswith("koci_bananiarz"):
             html_path = os.path.join(cwd, "index.html")
        else:
            html_path = os.path.join(cwd, "koci_bananiarz/index.html")

        url = f"file://{html_path}"

        page.goto(url)

        # Verify Difficulty labels in screenshot
        # Take a screenshot of the menu
        page.screenshot(path="koci_bananiarz/verification/menu_screenshot.png")

        # Start game in Easy mode (0 dogs), set time to short
        page.select_option("#setting-difficulty", "easy")
        page.fill("#setting-time", "10")
        page.click("#btn-start")

        # Wait for game over
        page.wait_for_timeout(12000)

        # Take screenshot of Game Over with Refresh button
        page.screenshot(path="koci_bananiarz/verification/gameover_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_screenshot()
