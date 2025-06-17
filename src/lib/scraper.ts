import { chromium, Browser, Page } from 'playwright';
import { ScrapingResult, SourceUrl } from '@/types/extraction';
import { ABOUT_PATHS, BROWSER_CONFIG, API_CONFIG } from '@/config/constants';
import { log, createErrorResponse, normalizeUrl } from '@/lib/utils';

/**
 * Scrapes a webpage and extracts its text content
 * @param url The URL to scrape
 * @returns A promise that resolves to a ScrapingResult
 */
export async function scrapePage(url: string): Promise<ScrapingResult> {
  let browser: Browser | undefined;
  let retryCount = 0;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    log('info', 'Starting page scrape', { url: normalizedUrl });

    while (retryCount < BROWSER_CONFIG.maxRetries) {
      try {
        browser = await chromium.launch();
        const page = await browser.newPage();

        // Set user agent
        await page.setExtraHTTPHeaders({
          'User-Agent': BROWSER_CONFIG.userAgent
        });

        log('info', 'Navigating to page', { url: normalizedUrl, attempt: retryCount + 1 });
        await page.goto(normalizedUrl, { 
          waitUntil: BROWSER_CONFIG.waitUntil,
          timeout: BROWSER_CONFIG.timeout
        });

        // Get the final URL after redirects
        const finalUrl = page.url();
        log('info', 'Final URL after redirects', { finalUrl });

        // Check for robots.txt
        const robotsTxt = await page.evaluate(async () => {
          try {
            const response = await fetch('/robots.txt');
            return await response.text();
          } catch {
            return null;
          }
        });

        if (robotsTxt) {
          log('debug', 'Found robots.txt', { content: robotsTxt });
          // TODO: Parse robots.txt and respect rules
        }

        log('info', 'Waiting for body');
        await page.waitForSelector('body');
        
        log('info', 'Checking for loading indicators');
        await page.waitForFunction(() => {
          const loaders = document.querySelectorAll('.loading, .spinner, [aria-busy="true"]');
          return loaders.length === 0;
        }, { timeout: BROWSER_CONFIG.loadingTimeout }).catch(() => 
          log('warn', 'No loading indicators found or timeout')
        );

        log('info', 'Waiting for content');
        await page.waitForTimeout(BROWSER_CONFIG.contentWait);

        log('info', 'Extracting text content');
        const rawText = await extractVisibleText(page);
        log('info', 'Text extraction complete', { length: rawText.length });

        // Get the full HTML content
        const rawHtml = await page.content();

        if (!rawText.trim()) {
          throw createErrorResponse(
            API_CONFIG.errorCodes.EXTRACTION_ERROR,
            'No content found on the page'
          );
        }

        // If this is the homepage, look for about page
        const isHomepage = !ABOUT_PATHS.some(path => normalizedUrl.toLowerCase().includes(path));
        let aboutPageText = '';
        let aboutPageHtml = '';

        if (isHomepage) {
          log('info', 'Homepage detected, looking for about page');
          const aboutLinks = await findAboutPageLinks(normalizedUrl, page);
          
          if (aboutLinks.length > 0) {
            log('info', 'Found about page', { url: aboutLinks[0] });
            const aboutPage = await browser.newPage();
            await aboutPage.goto(aboutLinks[0], { waitUntil: BROWSER_CONFIG.waitUntil });
            await aboutPage.waitForSelector('body');
            aboutPageText = await extractVisibleText(aboutPage);
            aboutPageHtml = await aboutPage.content();
            await aboutPage.close();
          }
        }

        const sourceUrl: SourceUrl = {
          url: normalizedUrl,
          type: isHomepage ? 'homepage' : 'about'
        };

        // Combine homepage and about page content if available
        const combinedText = aboutPageText 
          ? `${rawText}\n\n=== ABOUT PAGE CONTENT ===\n\n${aboutPageText}`
          : rawText;
        const combinedHtml = aboutPageHtml
          ? `${rawHtml}\n\n<!-- ABOUT PAGE HTML -->\n\n${aboutPageHtml}`
          : rawHtml;

        const result: ScrapingResult = {
          rawText: combinedText,
          rawHtml: combinedHtml,
          sourceUrl
        };

        return result;
      } catch (error) {
        retryCount++;
        log('warn', 'Scraping attempt failed', { 
          attempt: retryCount, 
          maxRetries: BROWSER_CONFIG.maxRetries,
          error 
        });

        if (retryCount >= BROWSER_CONFIG.maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, BROWSER_CONFIG.retryDelay));
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }

    throw createErrorResponse(
      API_CONFIG.errorCodes.EXTRACTION_ERROR,
      'Failed to scrape page after multiple attempts'
    );
  } catch (error) {
    log('error', 'Scraping error', { error });
    throw error;
  }
}

/**
 * Finds about page links on the homepage
 */
async function findAboutPageLinks(baseUrl: string, page: Page): Promise<string[]> {
  log('debug', 'Finding about page links');
  
  try {
    // Find all links
    const links = await page.evaluate((paths) => {
      const anchors = Array.from(document.getElementsByTagName('a'));
      return anchors
        .map(a => a.href)
        .filter(href => {
          try {
            const url = new URL(href);
            return paths.some(path => url.pathname.toLowerCase().includes(path));
          } catch {
            return false;
          }
        });
    }, ABOUT_PATHS);

    const uniqueLinks = [...new Set(links)]; // Remove duplicates
    log('debug', 'Found about page links', { count: uniqueLinks.length });
    
    return uniqueLinks;
  } catch (error) {
    log('error', 'Error finding about page links', { error });
    return [];
  }
}

/**
 * Extracts visible text from a page
 */
async function extractVisibleText(page: Page): Promise<string> {
  try {
    return await page.evaluate(() => {
      const isVisible = (element: Element): boolean => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.getBoundingClientRect().height > 0;
      };

      const getText = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent?.trim() || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (!isVisible(element)) return '';
          
          if (element.nodeName === 'SCRIPT' || element.nodeName === 'STYLE') {
            return '';
          }

          return Array.from(element.childNodes)
            .map(getText)
            .filter(Boolean)
            .join(' ');
        }

        return '';
      };

      return getText(document.body);
    });
  } catch (error) {
    log('error', 'Error extracting visible text', { error });
    throw createErrorResponse(
      API_CONFIG.errorCodes.EXTRACTION_ERROR,
      'Failed to extract text from page',
      error instanceof Error ? error.message : String(error)
    );
  }
} 