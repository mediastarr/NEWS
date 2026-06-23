import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/render', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url');

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'AR-Browser/1.0'
      }
    });

    let html = await response.text();
    const $ = cheerio.load(html);

    // Strip CSP/meta that can block embedding
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[content*="CSP"]').remove();

    // Rewrite links to go back through proxy
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      if (href.startsWith('javascript:')) return;

      const absolute = new URL(href, targetUrl).toString();
      $(el).attr('href', `/render?url=${encodeURIComponent(absolute)}`);
    });

    // Rewrite script src to absolute (keep inline for now)
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) return;
      const absolute = new URL(src, targetUrl).toString();
      $(el).attr('src', absolute);
    });

    // Inject bridge + video detector
    $('head').append(`
      <script>
        (function() {
          // AR browser bridge
          window.AR_BROWSER_BRIDGE = {
            navigate: function(url) {
              window.location.href = '/render?url=' + encodeURIComponent(url);
            },
            postMessage: function(payload) {
              if (window.parent) {
                window.parent.postMessage(payload, '*');
              }
            }
          };

          // Auto video detection for mini-player
          function sendMainVideo(videoEl) {
            if (!videoEl) return;
            var src = videoEl.currentSrc || videoEl.src;
            if (!src) return;

            var title =
              document.querySelector('meta[property="og:title"]')?.content ||
              document.title ||
              'Video';

            if (window.parent) {
              window.parent.postMessage({
                source: 'PAGE_VIDEO',
                type: 'mainVideo',
                src: src,
                title: title
              }, '*');
            }
          }

          function findMainVideo() {
            var videos = document.querySelectorAll('video');
            if (videos.length > 0) return videos[0];
            return null;
          }

          // Initial scan
          var mainVideo = findMainVideo();
          if (mainVideo) {
            // When it starts playing, notify parent
            mainVideo.addEventListener('play', function() {
              sendMainVideo(mainVideo);
            }, { once: true });
          }

          // Mutation observer for dynamically added videos (YouTube-like)
          var observer = new MutationObserver(function() {
            if (mainVideo && !mainVideo.paused) return;
            var v = findMainVideo();
            if (v && v !== mainVideo) {
              mainVideo = v;
              mainVideo.addEventListener('play', function() {
                sendMainVideo(mainVideo);
              }, { once: true });
            }
          });

          observer.observe(document.documentElement, {
            childList: true,
            subtree: true
          });

          // Listen for AR_BROWSER messages (scroll/click)
          window.addEventListener('message', function(event) {
            var data = event.data;
            if (!data || data.source !== 'AR_BROWSER') return;

            if (data.type === 'scroll') {
              window.scrollBy(0, data.deltaY || 0);
            }

            if (data.type === 'click') {
              var x = (data.x || 0.5) * window.innerWidth;
              var y = (data.y || 0.5) * window.innerHeight;
              var el = document.elementFromPoint(x, y);
              if (el) el.click();
            }
          });
        })();
      </script>
    `);

    html = $.html();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => {
  console.log(`AR browser proxy running on http://localhost:${PORT}`);
});
