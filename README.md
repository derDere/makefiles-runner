# Makefiles-Runner for VsCode

>Make runner for VsCode. Simplify your development by easily running your makefiles commands directly from your IDE interface.

## Usage

- Create your "Makefile" at the root of your project
- Show the Makefiles-Runner panel
- Run any command with one click 🚀
  
## Feature

Makefile allows you to simply run your makefile commands from the side bar panel.

<br />

<img src="https://raw.githubusercontent.com/Akecel/makefiles-runner/main/assets/doc/feature.gif" alt="Usage demo" />

### Listed commands

The panel lists the targets the way GNU make reads them: every name left of the rule colon is a command, with or without prerequisites (`build: install`). Variable assignments, special targets such as `.PHONY`, pattern rules (`%.o: %.c`) and targets built from variables (`$(OUT):`) stay out of the list.

### Command descriptions

Comments starting with `##` describe a command. They stand on the lines directly above the rule, behind the rule, or both:

```makefile
## Builds the server and the app.
build: install ## Requires the installed dependencies.
```

Consecutive `##` lines are joined into one description; a blank line or any other line ends the block. The description appears next to the command in the panel and as its tooltip.

### Icons

Every command shows a [codicon](https://code.visualstudio.com/api/references/icons-in-labels#icon-listing) that matches its name, e.g. `start` → play, `build` → tools, `test` → beaker, `install` → cloud-download, `clean` → trash. A name also matches when it starts with the key followed by `-` or `_`, so `test-live` shows the test icon. The `icons` setting adds and overrides entries.

### Run buttons in the editor

While the Makefile at the root of the workspace is open in the editor, a `▶ Run make <target>` button stands above each rule and runs the command like a click in the panel.

## Extension Settings

- `sortAlphabetically`: Sorts the makefile commands shown in the panel in alphabetical order, defaults to false.  When disabled, commands are shown in the same order as they appear within the makefile itself.
- `displayDescriptionCommentsInPanel"`: Optionally shows the convention-based comment about each command in the makefile as text next to each command in the panel, defaults to true.  Descriptions will be shown on-hover regardless of the value of this setting.
- `alwaysCreateNewTerminal`: Creates a new terminal rather than reusing an existing one when set true, defaults to false.
- `reuseMatchingTerminal`: Reuses the first terminal with a matching command label when set true, defaults to false.  Overrides alwaysCreateNewTerminal if both set true, so new terminals will only be created when running a command with no matching terminal.
- `icons`: Assigns codicon ids to commands, e.g. `{ "record-fixture": "record" }`. Keys match a command with the same name or a command starting with the key followed by `-` or `_`; the longest matching key wins. Entries extend and override the built-in mapping, commands without a match show the `terminal` icon.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/Akecel/makefiles-runner/tree/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

- [**Akecel**](https://github.com/Akecel) - *Extension author*

## Licence

This project is licensed under the [MIT License](https://opensource.org/licenses)  - see the [LICENSE.md](https://github.com/Akecel/makefiles-runner/blob/master/LICENSE) file for details.

## Show your support

Give a ⭐️ if this project helped you!
