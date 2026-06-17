const { WorkerPreset } = require("graphile-worker");

module.exports = {
  extends: [WorkerPreset],
  worker: {
    taskDirectory: `${__dirname}/dist/tasks`,
    connectionString: process.env.DATABASE_URL,
    maxPoolSize: 10,
    pollInterval: 2000,
    preparedStatements: true,
    schema: "graphile_worker",
    crontabFile: "crontab",
    concurrentJobs: 1,
    fileExtensions: [".js", ".cjs", ".mjs"],
  },
};
