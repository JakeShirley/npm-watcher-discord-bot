const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

require("dotenv").config();

import NPMRegistry from "./NPMRegistry";

const DEFAULT_REGISTRY = "https://registry.npmjs.org";

const commands = [
  new SlashCommandBuilder()
    .setName("watchpackage")
    .setDescription("Watch an NPM package")
    .addStringOption((option) =>
      option
        .setName("package")
        .setDescription("Name of the package to watch")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("registry")
        .setDescription(
          `The NPM registry the package is in (default is \`${DEFAULT_REGISTRY}\``
        )
    ),
  new SlashCommandBuilder()
    .setName("versions")
    .setDescription("List a package's versions")
    .addStringOption((option) =>
      option
        .setName("package")
        .setDescription("Name of the package to watch")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("registry")
        .setDescription(
          `The NPM registry the package is in (default is \`${DEFAULT_REGISTRY}\``
        )
    ),
  new SlashCommandBuilder()
    .setName("testrelease")
    .setDescription("Pretend a specific version just released")
    .addStringOption((option) =>
      option
        .setName("package")
        .setDescription("Name of the package to watch")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("version")
        .setDescription("Version of the package")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("registry")
        .setDescription(
          `The NPM registry the package is in (default is \`${DEFAULT_REGISTRY}\``
        )
    ),
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID), {
      body: commands.map((x) => x.toJSON()),
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "watchpackage") {
    const packageName = interaction.options.getString("package");
    const registryUrl =
      interaction.options.getString("registry") ?? DEFAULT_REGISTRY;

    await interaction.reply(
      `Registering for package \`${packageName}\` at registry \`${registryUrl}\``
    );
  } else if (interaction.commandName === "versions") {
    const packageName = interaction.options.getString("package");
    const registryUrl =
      interaction.options.getString("registry") ?? DEFAULT_REGISTRY;

    const registry = new NPMRegistry(registryUrl);
    const versions = await registry.getPackageVersions(packageName);

    const result = `**${packageName}** - Available Versions:\n${versions
      .map((x) => `- \`${x}\``)
      .join("\n")}`;

    await interaction.reply(result);
  } else if (interaction.commandName === "testrelease") {
    const packageName = interaction.options.getString("package");
    const packageVersion = interaction.options.getString("version");
    const registryUrl =
      interaction.options.getString("registry") ?? DEFAULT_REGISTRY;

    const registry = new NPMRegistry(registryUrl);
    const info = await registry.getPackageInfo(packageName);

    const releasedVersionIndex = info.versions.indexOf(packageVersion);

    if (releasedVersionIndex == -1) {
      await interaction.reply(
        `Release \`${packageName}@${packageVersion}\` was not found in registry \`${registryUrl}\``
      );
    }

    const tags = info["dist-tags"];
    const tagIndex: string | undefined = Object.keys(tags).find(
      (key) => tags[key] === packageVersion
    );

    const releasedDate = new Date(info.time[packageVersion]);

    const result = `NEW RELEASE - **${packageName}@${packageVersion}**:\n\tReleased at ${releasedDate.toTimeString()}\n\tTag: ${
      tagIndex ? `\`${tags[tagIndex]}\`` : "n/a"
    }`;

    await interaction.reply(result);
  }
});

client.login(process.env.BOT_TOKEN);
