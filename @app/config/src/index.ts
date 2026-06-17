const packageJson = require("../../../package.json");

export const fromEmail =
  process.env.FROM_EMAIL || `${packageJson.projectName} <no-reply@example.com>`;
export const contactEmail = process.env.CONTACT_EMAIL || "support@example.com";
export const projectName = packageJson.projectName.replace(/[-_]/g, " ");
export const version = packageJson.version;
export const copyrightOwner =
  process.env.COPYRIGHT_OWNER || projectName;

export const awsRegion = process.env.AWS_REGION || "eu-west-1";

export const emailLegalText =
  process.env.LEGAL_TEXT || `Copyright ${projectName}`;
