const pino = (level, ...args) => {
  // A minimal logger placeholder; swap with pino/winston when ready.
  // eslint-disable-next-line no-console
  console[level](...args);
};

module.exports = {
  info: (...args) => pino('info', ...args),
  error: (...args) => pino('error', ...args),
  warn: (...args) => pino('warn', ...args),
};
