import { AwsCdkConstructLibrary } from "@pepperize/projen-awscdk-construct";
import { awscdk, javascript, JsonPatch } from "projen";

const project = new AwsCdkConstructLibrary({
  author: "Steffan Norberhuis",
  authorAddress: "steffan.norberhuis@rocketleap.dev",
  license: "MIT",
  copyrightOwner: "Norberhuis Onderneming B.V.",

  cdkVersion: "2.204.0",
  constructsVersion: "10.4.2",

  name: "@rocketleap/cdk-organizations",
  description: "Manage AWS organizations, organizational units (OU), accounts and service control policies (SCP).",
  keywords: [
    "aws",
    "cdk",
    "organizations",
    "organization-principal",
    "organizational-unit",
    "account",
    "account-management",
    "policies",
    "service-control-policy",
    "delegated-administrator",
    "trusted-service",
    "trusted-access",
    "tag-resources",
  ],
  repositoryUrl: "https://github.com/rocketleap/cdk-organizations.git",

  projenrcTs: true,

  deps: ["pascal-case"],
  bundledDeps: ["pascal-case"],
  devDeps: [
    "@pepperize/projen-awscdk-construct@~0.0.730",
    "@types/aws-lambda",
    "@types/jest",
    "@types/sinon",
    "aws-lambda",
    "aws-sdk",
    "aws-sdk-mock",
    "cdk-nag",
    "jest-cdk-snapshot",
    "sinon",
  ],

  versionrcOptions: {
    types: [{ type: "chore", section: "Chore", hidden: false }],
  },

  defaultReleaseBranch: "main",
  releaseToNpm: true,
  npmAccess: javascript.NpmAccess.PUBLIC,
  // publishToNuget: {
  //   dotNetNamespace: "Pepperize.CDK",
  //   packageId: "Pepperize.CDK.Organizations",
  // },
  // publishToPypi: {
  //   distName: "pepperize.cdk-organizations",
  //   module: "pepperize_cdk_organizations",
  // },
  // publishToMaven: {
  //   mavenEndpoint: "https://s01.oss.sonatype.org",
  //   mavenGroupId: "com.pepperize",
  //   mavenArtifactId: "cdk-organizations",
  //   javaPackage: "com.pepperize.cdk.organizations",
  // },

  gitpod: true,

  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_22_X,
    bundlingOptions: {
      externals: [],
    },
  },
});

project.gitpod?.addCustomTask({
  name: "setup",
  init: "yarn install && npx projen build",
  command: "npx projen watch",
});

project.release?.publisher.publishToNpm({
  registry: "registry.npmjs.org",
  distTag: "latest",
  npmProvenance: true,
  prePublishSteps: [
    {
      name: "Checkout",
      uses: "actions/checkout@v4",
      with: {
        path: ".repo",
      },
    },
    {
      name: "Install Dependencies",
      run: "cd .repo && yarn install --check-files --frozen-lockfile",
    },
    {
      name: "Extract build artifact",
      run: "tar --strip-components=1 -xzvf dist/js/*.tgz -C .repo",
    },
    {
      name: "Move build artifact out of the way",
      run: "mv dist dist.old",
    },
    {
      name: "Create js artifact",
      run: "cd .repo && npx projen package:js",
    },
    { name: "Collect js artifact", run: "mv .repo/dist dist" },
  ],
  postPublishSteps: [
    {
      name: "Release to GitHub",
      run: "npx -p publib@latest publib-npm",
      env: {
        NPM_DIST_TAG: "latest",
        NPM_REGISTRY: "npm.pkg.github.com",
        NPM_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
      },
    },
  ],
});

const release = project.github!.addWorkflow("release-flow");
release.on({
  push: { branches: ["main"] },
});

project.tryFindObjectFile(".github/workflows/release.yml")?.patch(
  JsonPatch.add("/jobs/release_npm/permissions", {
    "id-token": "write",
    contents: "read",
    packages: "write",
  })
);

project.gitpod?.addVscodeExtensions("dbaeumer.vscode-eslint");

project.synth();
