import os
from playwright.sync_api import sync_playwright

def test_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine the correct path to the HTML file
        # Assuming the script runs from repo root or verify folder
        # We need absolute path to index.html
        cwd = os.getcwd()
        if cwd.endswith("verification"):
            html_path = os.path.join(cwd, "../index.html")
        elif cwd.endswith("koci_bananiarz"):
             html_path = os.path.join(cwd, "index.html")
        else:
            html_path = os.path.join(cwd, "koci_bananiarz/index.html")

        url = f"file://{html_path}"
        print(f"Opening {url}")

        # --- Test Easy (0 dogs) ---
        page.goto(url)
        page.select_option("#setting-difficulty", "easy")
        page.click("#btn-start")

        # Wait for game to initialize
        page.wait_for_timeout(1000)

        dogs_count = page.evaluate("window.__TEST_ACCESS__.dogs.length")
        print(f"Easy Mode Dogs: {dogs_count}")
        assert dogs_count == 0, f"Expected 0 dogs in Easy mode, found {dogs_count}"

        # --- Test Normal (1 dog) ---
        page.reload()
        page.select_option("#setting-difficulty", "normal")
        page.click("#btn-start")
        page.wait_for_timeout(1000)

        dogs_count = page.evaluate("window.__TEST_ACCESS__.dogs.length")
        print(f"Normal Mode Dogs: {dogs_count}")
        assert dogs_count == 1, f"Expected 1 dog in Normal mode, found {dogs_count}"

        # --- Test Hard (2 dogs) ---
        page.reload()
        page.select_option("#setting-difficulty", "hard")
        page.click("#btn-start")
        page.wait_for_timeout(1000)

        dogs_count = page.evaluate("window.__TEST_ACCESS__.dogs.length")
        print(f"Hard Mode Dogs: {dogs_count}")
        assert dogs_count == 2, f"Expected 2 dogs in Hard mode, found {dogs_count}"

        # --- Test Refresh Button on Game Over ---
        page.reload()
        # Set time to minimum (10s) to speed up game over
        page.fill("#setting-time", "10")
        page.click("#btn-start")

        print("Waiting for game over (approx 10s)...")
        # We need to wait for > 10 seconds.
        # The game loop decrements timeLeft every second.
        # Let's wait 12 seconds to be safe.
        page.wait_for_timeout(12000)

        # Check for Game Over message
        msg = page.inner_text("#message")
        print(f"Message: {msg}")
        assert "KONIEC GRY" in msg, "Game Over message not found"

        # Check if Refresh button is visible
        btn_display = page.evaluate("document.getElementById('btn-restart').style.display")
        print(f"Refresh Button Display: {btn_display}")
        assert btn_display != "none", "Refresh button should be visible"

        # Click refresh and see if it reloads
        # We can't easily check page reload with file:// protocol in some contexts without a server,
        # but we can check if it triggers navigation or if the state resets.
        # With page.reload() it resets. The button calls location.reload().

        print("Tests passed!")
        browser.close()

if __name__ == "__main__":
    test_game()
