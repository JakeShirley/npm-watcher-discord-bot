const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

require("dotenv").config();

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

    // npm view @minecraft/server versions --json
    const { stdout, stderr } = await exec(
      `npm view ${packageName} versions --json`
    );

    const output = JSON.parse(stdout);

    const result = `**${packageName}** - Available Versions:\n${output
      .map((x) => `- \`${x}\``)
      .join("\n")}`;

    await interaction.reply(result);
  }
});

client.login(process.env.BOT_TOKEN);
