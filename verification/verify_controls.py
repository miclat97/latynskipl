from playwright.sync_api import sync_playwright

def verify_game_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a mobile viewport to simulate the environment
        context = browser.new_context(
            viewport={'width': 412, 'height': 915},
            user_agent='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
        )
        page = context.new_page()

        # Load the game from the local file system
        import os
        cwd = os.getcwd()
        file_path = f"file://{cwd}/koci_bananiarz/index.html"
        page.goto(file_path)

        # Start the game to see the controls
        # Click the "GRAJ" button
        page.click('#btn-start')

        # Wait for the game controls to appear
        page.wait_for_selector('#mobile-controls', state='visible')

        # Take a screenshot of the entire page
        page.screenshot(path="verification/mobile_controls_check.png")
        print("Screenshot saved to verification/mobile_controls_check.png")

        browser.close()

if __name__ == "__main__":
    verify_game_ui()
