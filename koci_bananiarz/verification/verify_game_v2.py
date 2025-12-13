
from playwright.sync_api import sync_playwright
import os

def run():
    file_path = os.path.abspath('cat-banana-game/index.html')
    url = f'file://{file_path}'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({'width': 375, 'height': 667})

        page.goto(url)

        # Wait for game
        page.wait_for_selector('#gameCanvas')

        # Wait a bit to ensure it renders
        page.wait_for_timeout(1500)

        # Take screenshot of Overworld
        page.screenshot(path='verification/game_overworld.png')
        browser.close()

if __name__ == '__main__':
    run()
