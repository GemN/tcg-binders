declare module "mjml-core/lib/includeExternal" {
  interface IncludeExternalOptions {
    filePath: string;
  }

  const includeExternal: (
    template: string,
    options: IncludeExternalOptions
  ) => string;

  export default includeExternal;
}
