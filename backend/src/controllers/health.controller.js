const env = require('../config/env');

const status = (req, res) => {
  res.json({
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { status };
