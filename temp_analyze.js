const puppeteer = require('puppeteer');

async function analyzePageDesign() {
  let browser;
  try {
    console.log('🚀 Starting Puppeteer analysis of JobPing frontend...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('📄 Navigating to https://getjobping.com...');
    await page.goto('https://getjobping.com', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Analyze headings
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => {
      return elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      })).filter(h => h.visible);
    });

    // Analyze images
    const images = await page.$$eval('img', elements => {
      return elements.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        loading: img.loading || 'sync'
      }));
    });

    // Analyze buttons
    const buttons = await page.$$eval('button, [role="button"], input[type="submit"], a[role="button"]', elements => {
      return elements.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent?.trim() || btn.getAttribute('aria-label') || '',
          tag: btn.tagName.toLowerCase(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0,
          disabled: btn.disabled || btn.getAttribute('aria-disabled') === 'true'
        };
      }).filter(btn => btn.visible);
    });

    // Analyze forms
    const forms = await page.$$eval('form', elements => {
      return elements.map(form => ({
        inputs: form.querySelectorAll('input, textarea, select').length,
        labels: form.querySelectorAll('label').length,
        required: form.querySelectorAll('[required]').length
      }));
    });

    // Analyze accessibility
    const accessibility = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const elementsWithAlt = document.querySelectorAll('img[alt], area[alt]');
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), area:not([alt])');

      return {
        totalElements: allElements.length,
        imagesWithAlt: elementsWithAlt.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        buttons: document.querySelectorAll('button, [role="button"]').length,
        links: document.querySelectorAll('a[href]').length,
        headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        landmarks: document.querySelectorAll('[role="banner"], [role="main"], [role="navigation"], [role="complementary"], header, main, nav, aside').length
      };
    });

    // Analyze performance
    const performance = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const scripts = resources.filter(r => r.initiatorType === 'script').length;
      const stylesheets = resources.filter(r => r.initiatorType === 'link').length;
      const images = resources.filter(r => r.initiatorType === 'img').length;

      return {
        scripts,
        stylesheets,
        images,
        totalResources: resources.length
      };
    });

    // Analyze layout and colors
    const layout = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);

      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize
      };
    });

    console.log('📊 Analysis complete!');

    const report = {
      url: 'https://getjobping.com',
      timestamp: new Date().toISOString(),
      headings: {
        total: headings.length,
        breakdown: headings.reduce((acc, h) => {
          acc[h.tag] = (acc[h.tag] || 0) + 1;
          return acc;
        }, {}),
        sample: headings.slice(0, 5)
      },
      images: {
        total: images.length,
        withAlt: images.filter(img => img.alt).length,
        lazyLoaded: images.filter(img => img.loading === 'lazy').length,
        sample: images.slice(0, 3)
      },
      buttons: {
        total: buttons.length,
        smallButtons: buttons.filter(btn => btn.height < 48).length,
        averageSize: {
          width: Math.round(buttons.reduce((sum, btn) => sum + btn.width, 0) / buttons.length),
          height: Math.round(buttons.reduce((sum, btn) => sum + btn.height, 0) / buttons.length)
        },
        sample: buttons.slice(0, 5)
      },
      forms: {
        total: forms.length,
        totalInputs: forms.reduce((sum, f) => sum + f.inputs, 0),
        totalLabels: forms.reduce((sum, f) => sum + f.labels, 0)
      },
      accessibility,
      performance,
      layout
    };

    console.log(JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzePageDesign();