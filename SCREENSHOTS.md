<div align="center">

# Linspector screenshots

A tour of every tab and what you can do in it.

Back to the [README](README.md) · [Русский](SCREENSHOTS.ru.md)

</div>

---

## Fetch

<div align="center"><img src="screenshots/fetch.png" width="360" alt="Fetch" /></div>

Every `fetch()` call the page makes, grouped into sectors by host. Click a row to expand the full URL, request and response headers, payload and pretty printed JSON response. Each sector has Archive All and Clear, and any request can be moved to History with the cross or sent straight to the Repeater.

## XHR

<div align="center"><img src="screenshots/xhr.png" width="360" alt="XHR" /></div>

The same live view for `XMLHttpRequest` traffic. Sectors, expandable details, Archive All, Clear and Send to Repeater, kept separate from fetch so you can focus on one transport at a time.

## Streams

<div align="center"><img src="screenshots/streams.png" width="360" alt="Streams" /></div>

WebSocket and Server Sent Events connections with a live per connection frame log. Every frame is tagged as sent, received, open, close or error with a timestamp, so you can follow a realtime channel as it happens.

## History

<div align="center"><img src="screenshots/history.png" width="360" alt="History" /></div>

Requests you closed from the traffic tabs land here. Restore one back into the active list, or delete it permanently. A handy shortlist of the requests you actually care about during a session.

## Intercept

<div align="center"><img src="screenshots/intercept.png" width="360" alt="Intercept" /></div>

Breakpoints. Turn them on and set a match pattern (a substring or `/regex/`); matching fetch requests pause before they are sent. Edit the URL, headers and body, then Forward the edited request, Drop it, or push it To Repeater.

## Repeater

<div align="center"><img src="screenshots/repeater.png" width="360" alt="Repeater" /></div>

Edit and resend any request. Change the method, URL, headers and body, attach a saved session, then Send and read the response inline. One click exports the request as cURL, Python or a raw Burp request, or forwards it to your Burp or Caido relay.

## Sessions

<div align="center"><img src="screenshots/sessions.png" width="360" alt="Sessions" /></div>

Presets of Authorization or Cookie headers. Keep several identities side by side, mark one active, and optionally inject it into all live traffic. Swapping the active session and resending in the Repeater is the fast path for IDOR and access control checks.

## Scanner

<div align="center"><img src="screenshots/scanner.png" width="360" alt="Scanner" /></div>

Passive findings from the traffic, ranked by severity. JWT weaknesses, leaked secrets and API keys, stack trace disclosure, CORS problems and missing security headers, each with the host and a copyable evidence snippet.

## Attack

<div align="center"><img src="screenshots/attack.png" width="360" alt="Attack" /></div>

Offensive helpers. A payload library for XSS, SQLi, SSTI and SSRF that you can copy or drop into the Repeater body, a Response diff that compares two captured responses line by line, and a manual JWT decoder and auditor.

## Storage

<div align="center"><img src="screenshots/storage.png" width="360" alt="Storage" /></div>

Inspect the page for this origin. Read, edit, add and delete LocalStorage keys, and list cookies readable from JavaScript with a Secure, HttpOnly and SameSite audit on each one.

## Settings

<div align="center"><img src="screenshots/settings.png" width="360" alt="Settings" /></div>

Tune behaviour: persist logs to LocalStorage, auto scroll, toggle the passive scanner, set a minimum status code, pick a theme, set the Burp or Caido forward endpoint, exclude domains, and manage Tamper rules that auto replace text in the URL, body or headers.
