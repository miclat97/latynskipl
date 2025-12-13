
from playwright.sync_api import sync_playwright
import os

def run():
    # Construct absolute path to the HTML file
    file_path = os.path.abspath('cat-banana-game/index.html')
    url = f'file://{file_path}'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to something reasonable
        page.set_viewport_size({'width': 375, 'height': 667})

        page.goto(url)

        # Wait for game to initialize (canvas present)
        page.wait_for_selector('#gameCanvas')

        # Wait a bit for game loop to render at least one frame
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path='verification/game_screenshot.png')
        browser.close()

if __name__ == '__main__':
    run()
