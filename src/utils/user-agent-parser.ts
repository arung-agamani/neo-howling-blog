/**
 * Lightweight User-Agent Parser
 * Parses user agent strings to extract device type, browser, and OS
 * No external dependencies - uses regex patterns
 */

export interface ParsedUserAgent {
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  browser: string;
  os: string;
}

// Bot patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
  /duckduckbot/i,
  /slurp/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
];

// Mobile patterns
const MOBILE_PATTERNS = [
  /Android.*Mobile/i,
  /iPhone/i,
  /iPod/i,
  /BlackBerry/i,
  /IEMobile/i,
  /Opera Mini/i,
  /Mobile Safari/i,
  /webOS/i,
  /Windows Phone/i,
];

// Tablet patterns
const TABLET_PATTERNS = [
  /iPad/i,
  /Android(?!.*Mobile)/i,
  /Tablet/i,
  /Kindle/i,
  /Silk/i,
  /PlayBook/i,
];

// Browser patterns (order matters - more specific first)
const BROWSER_PATTERNS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\/[\d.]+/i, "Edge"],
  [/OPR\/[\d.]+/i, "Opera"],
  [/Opera\/[\d.]+/i, "Opera"],
  [/Vivaldi\/[\d.]+/i, "Vivaldi"],
  [/Brave\/[\d.]+/i, "Brave"],
  [/YaBrowser\/[\d.]+/i, "Yandex"],
  [/SamsungBrowser\/[\d.]+/i, "Samsung Browser"],
  [/UCBrowser\/[\d.]+/i, "UC Browser"],
  [/Firefox\/[\d.]+/i, "Firefox"],
  [/FxiOS\/[\d.]+/i, "Firefox"],
  [/Chrome\/[\d.]+/i, "Chrome"],
  [/CriOS\/[\d.]+/i, "Chrome"],
  [/Safari\/[\d.]+/i, "Safari"],
  [/MSIE [\d.]+/i, "Internet Explorer"],
  [/Trident\/[\d.]+/i, "Internet Explorer"],
];

// OS patterns (order matters - more specific first)
const OS_PATTERNS: [RegExp, string][] = [
  [/Windows NT 10/i, "Windows 10/11"],
  [/Windows NT 6\.3/i, "Windows 8.1"],
  [/Windows NT 6\.2/i, "Windows 8"],
  [/Windows NT 6\.1/i, "Windows 7"],
  [/Windows NT 6\.0/i, "Windows Vista"],
  [/Windows NT 5\.1/i, "Windows XP"],
  [/Windows/i, "Windows"],
  [/Mac OS X [\d_]+/i, "macOS"],
  [/Macintosh/i, "macOS"],
  [/CrOS/i, "Chrome OS"],
  [/Android [\d.]+/i, "Android"],
  [/Android/i, "Android"],
  [/iPhone OS [\d_]+/i, "iOS"],
  [/iPad.*OS [\d_]+/i, "iPadOS"],
  [/iOS/i, "iOS"],
  [/Linux/i, "Linux"],
  [/Ubuntu/i, "Ubuntu"],
  [/Fedora/i, "Fedora"],
  [/FreeBSD/i, "FreeBSD"],
];

/**
 * Detect if user agent is a bot
 */
function isBot(ua: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(
  ua: string
): "desktop" | "mobile" | "tablet" | "bot" | "unknown" {
  if (!ua) return "unknown";

  // Check for bots first
  if (isBot(ua)) return "bot";

  // Check for tablets (before mobile, as some tablets match mobile patterns)
  if (TABLET_PATTERNS.some((pattern) => pattern.test(ua))) return "tablet";

  // Check for mobile devices
  if (MOBILE_PATTERNS.some((pattern) => pattern.test(ua))) return "mobile";

  // Default to desktop for standard browsers
  if (
    /Mozilla|Chrome|Safari|Firefox|Edge|Opera/i.test(ua) &&
    !/Mobile/i.test(ua)
  ) {
    return "desktop";
  }

  return "unknown";
}

/**
 * Detect browser from user agent
 */
function detectBrowser(ua: string): string {
  if (!ua) return "Unknown";

  for (const [pattern, name] of BROWSER_PATTERNS) {
    if (pattern.test(ua)) {
      return name;
    }
  }

  return "Unknown";
}

/**
 * Detect operating system from user agent
 */
function detectOS(ua: string): string {
  if (!ua) return "Unknown";

  for (const [pattern, name] of OS_PATTERNS) {
    if (pattern.test(ua)) {
      return name;
    }
  }

  return "Unknown";
}

/**
 * Parse a user agent string and extract device info
 * @param userAgent - The user agent string to parse
 * @returns Parsed user agent information
 */
export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  const ua = userAgent || "";

  return {
    deviceType: detectDeviceType(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
  };
}

/**
 * Quick check if a user agent is a bot
 * Useful for filtering out bot traffic
 */
export function isBotUserAgent(userAgent: string | null): boolean {
  return userAgent ? isBot(userAgent) : false;
}
