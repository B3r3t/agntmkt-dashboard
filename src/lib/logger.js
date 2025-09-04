const isProd = process.env.NODE_ENV === 'production';

export function info(...args) {
  if (!isProd) {
    console.log(...args);
  }
}

export function warn(...args) {
  if (!isProd) {
    console.warn(...args);
  }
}

export function error(...args) {
  if (!isProd) {
    console.error(...args);
  }
}
