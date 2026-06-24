import {
  emailLegalText as legalText,
  fromEmail,
  projectName,
} from "@app/config";
import chalk from "chalk";
import { promises as fsp } from "fs";
import { Task } from "graphile-worker";
import { htmlToText } from "html-to-text";
import { template as lodashTemplate } from "lodash";
import mjml2html from "mjml";
import mjmlInclude from "mjml-core/lib/includeExternal";
import * as nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer/index";
import * as process from "process";

import getTransport from "../transport";

declare global {
  var TEST_EMAILS: unknown[];
}

global.TEST_EMAILS = [];

const { readFile } = fsp;

const isTest = process.env.NODE_ENV === "test";
const isDev = process.env.NODE_ENV !== "production";

export interface SendEmailPayload {
  options: {
    from?: string;
    to: string | string[];
    subject: string;
    bcc?: string | string[];
    cc?: string | string[];
  };
  template: string;
  variables: SendEmailVariables;
}

type SendEmailVariables = Record<string, unknown>;
type TemplateRenderer = (variables: SendEmailVariables) => string;

const task: Task = async (inPayload) => {
  const payload = inPayload as SendEmailPayload;
  const transport = await getTransport();
  const { options: inOptions, template, variables } = payload;

  const options: Mail.Options = {
    from: fromEmail,
    ...inOptions,
    to: inOptions.to,
  };

  if (template) {
    const templateFn = await loadTemplate(template);
    const html = await templateFn(variables);
    const html2textableHtml = html.replace(/(<\/?)div/g, "$1p");
    const text = htmlToText(html2textableHtml, {
      wordwrap: 120,
    }).replace(/\n\s+\n/g, "\n\n");
    Object.assign(options, { html, text });
  }
  const info = await transport.sendMail(options);
  if (isTest) {
    global.TEST_EMAILS.push(info);
  } else if (isDev) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      console.log(`Development email preview: ${chalk.blue.underline(url)}`);
    }
  }
};

module.exports = task;

const templatePromises: Record<string, Promise<TemplateRenderer>> = {};
function loadTemplate(template: string): Promise<TemplateRenderer> {
  if (isDev || !templatePromises[template]) {
    templatePromises[template] = (async () => {
      if (!template.match(/^[a-zA-Z0-9_.-]+$/)) {
        throw new Error(`Disallowed template name '${template}'`);
      }
      const templateString = await readFile(
        `${__dirname}/../../templates/${template}`,
        "utf8"
      );
      const templateWithIncludes = mjmlInclude(templateString, {
        filePath: `${__dirname}/../../templates/${template}`,
      }) as string;
      const templateFn = lodashTemplate(templateWithIncludes, {
        escape: /\[\[([\s\S]+?)\]\]/g,
      });
      return (variables: SendEmailVariables) => {
        const mjml = templateFn({
          projectName,
          legalText,
          urlContact: `${process.env.ROOT_URL}/support`,
          ...variables,
        });
        const { html, errors } = mjml2html(mjml);
        if (errors && errors.length) {
          console.error(errors);
        }
        return html;
      };
    })();
  }
  return templatePromises[template];
}
