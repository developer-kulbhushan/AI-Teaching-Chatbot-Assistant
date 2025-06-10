from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

class WebScraper:
    def __init__(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode
        self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    def scrape_text(self, url):
        self.driver.get(url)
        time.sleep(5)  # Wait for the page to load
        
        # Get all text content
        body = self.driver.find_element(By.TAG_NAME, 'body')
        text = body.text
        
        # Get all links and convert to markdown format
        links = self.driver.find_elements(By.TAG_NAME, 'a')
        for link in links:
            href = link.get_attribute('href')
            link_text = link.text
            if href and link_text:
                text = text.replace(link_text, f'[{link_text}]({href})')
        
        return text

    def close(self):
        self.driver.quit()